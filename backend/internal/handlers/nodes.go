package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"ecommerce-neo4j/internal/db"
	"ecommerce-neo4j/internal/models"
)

var validName = regexp.MustCompile(`^[A-Za-z][A-Za-z0-9_]*$`)

func validateLabel(label string) bool {
	return validName.MatchString(label)
}
func validatePropKey(key string) bool {
	return validName.MatchString(key)
}

// POST /api/nodes
// Handles 1-label and 2+-label creation based on how many labels are in the body.
func CreateNode(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.CreateNodeRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			jsonError(w, "invalid body", http.StatusBadRequest)
			return
		}
		if len(req.Labels) == 0 {
			jsonError(w, "labels required", http.StatusBadRequest)
			return
		}
		for _, l := range req.Labels {
			if !validateLabel(l) {
				jsonError(w, "invalid label: "+l, http.StatusBadRequest)
				return
			}
		}
		labelStr := strings.Join(req.Labels, ":")
		props := db.ConvertPropsToNeo4j(req.Properties)

		query := fmt.Sprintf("CREATE (n:%s $props) RETURN n", labelStr)
		rows, err := database.Write(r.Context(), query, map[string]interface{}{"props": props})
		if err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		jsonOK(w, rows[0]["n"])
	}
}

// GET /api/nodes?label=User&limit=20&skip=0&filter=field:op:value
// Supports filtering by equality, range (minPrice, maxPrice), and full-text on name.
func GetNodes(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		label := r.URL.Query().Get("label")
		if label == "" || !validateLabel(label) {
			jsonError(w, "valid label required", http.StatusBadRequest)
			return
		}
		limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
		if limit <= 0 {
			limit = 20
		}
		skip, _ := strconv.Atoi(r.URL.Query().Get("skip"))

		params := map[string]interface{}{"limit": limit, "skip": skip}
		conditions := []string{}

		// Generic equality filter: ?prop=value (for any property)
		for key, vals := range r.URL.Query() {
			if key == "label" || key == "limit" || key == "skip" || key == "minPrice" || key == "maxPrice" || key == "isPremium" || key == "isActive" {
				continue
			}
			if validatePropKey(key) && len(vals) > 0 {
				paramKey := "p_" + key
				conditions = append(conditions, fmt.Sprintf("toLower(n.%s) CONTAINS toLower($%s)", key, paramKey))
				params[paramKey] = vals[0]
			}
		}
		if minPrice := r.URL.Query().Get("minPrice"); minPrice != "" {
			if v, err := strconv.ParseFloat(minPrice, 64); err == nil {
				conditions = append(conditions, "n.price >= $minPrice")
				params["minPrice"] = v
			}
		}
		if maxPrice := r.URL.Query().Get("maxPrice"); maxPrice != "" {
			if v, err := strconv.ParseFloat(maxPrice, 64); err == nil {
				conditions = append(conditions, "n.price <= $maxPrice")
				params["maxPrice"] = v
			}
		}
		if isPremium := r.URL.Query().Get("isPremium"); isPremium != "" {
			b, err := strconv.ParseBool(isPremium)
			if err == nil {
				conditions = append(conditions, "n.isPremium = $isPremium")
				params["isPremium"] = b
			}
		}
		if isActive := r.URL.Query().Get("isActive"); isActive != "" {
			b, err := strconv.ParseBool(isActive)
			if err == nil {
				conditions = append(conditions, "n.isActive = $isActive")
				params["isActive"] = b
			}
		}

		where := ""
		if len(conditions) > 0 {
			where = "WHERE " + strings.Join(conditions, " AND ")
		}
		query := fmt.Sprintf("MATCH (n:%s) %s RETURN n SKIP $skip LIMIT $limit", label, where)
		rows, err := database.Read(r.Context(), query, params)
		if err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Count query
		countQuery := fmt.Sprintf("MATCH (n:%s) %s RETURN count(n) AS total", label, where)
		countRows, _ := database.Read(r.Context(), countQuery, params)
		total := 0
		if len(countRows) > 0 {
			if t, ok := countRows[0]["total"]; ok {
				total = int(toInt64(t))
			}
		}

		nodes := make([]interface{}, 0)
		for _, row := range rows {
			nodes = append(nodes, row["n"])
		}
		jsonOKCount(w, nodes, total)
	}
}

// GET /api/nodes/{id}?label=User
func GetNodeByID(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		label := r.URL.Query().Get("label")
		if label == "" || !validateLabel(label) {
			jsonError(w, "valid label required", http.StatusBadRequest)
			return
		}
		idField := db.IDField(label)
		query := fmt.Sprintf("MATCH (n:%s {%s: $id}) RETURN n", label, idField)
		rows, err := database.Read(r.Context(), query, map[string]interface{}{"id": id})
		if err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if len(rows) == 0 {
			jsonError(w, "not found", http.StatusNotFound)
			return
		}
		jsonOK(w, rows[0]["n"])
	}
}

// GET /api/nodes/stats?label=User
func GetNodeStats(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		label := r.URL.Query().Get("label")
		if label == "" || !validateLabel(label) {
			jsonError(w, "valid label required", http.StatusBadRequest)
			return
		}
		query := fmt.Sprintf(`MATCH (n:%s) RETURN count(n) AS total`, label)
		rows, err := database.Read(r.Context(), query, nil)
		if err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		jsonOK(w, rows[0])
	}
}

// PATCH /api/nodes/properties — update/add props to 1 or multiple nodes
func UpdateNodeProperties(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.UpdatePropertiesRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			jsonError(w, "invalid body", http.StatusBadRequest)
			return
		}
		if !validateLabel(req.Label) || len(req.IDs) == 0 || len(req.Properties) == 0 {
			jsonError(w, "label, ids, and properties required", http.StatusBadRequest)
			return
		}
		idField := db.IDField(req.Label)
		props := db.ConvertPropsToNeo4j(req.Properties)

		query := fmt.Sprintf(`
UNWIND $ids AS id
MATCH (n:%s {%s: id})
SET n += $props
RETURN n`, req.Label, idField)

		rows, err := database.Write(r.Context(), query, map[string]interface{}{
			"ids":   req.IDs,
			"props": props,
		})
		if err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		nodes := make([]interface{}, 0)
		for _, row := range rows {
			nodes = append(nodes, row["n"])
		}
		jsonOKCount(w, nodes, len(nodes))
	}
}

// DELETE /api/nodes/properties — remove props from 1 or multiple nodes
func RemoveNodeProperties(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.RemovePropertiesRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			jsonError(w, "invalid body", http.StatusBadRequest)
			return
		}
		if !validateLabel(req.Label) || len(req.IDs) == 0 || len(req.Keys) == 0 {
			jsonError(w, "label, ids, and keys required", http.StatusBadRequest)
			return
		}
		for _, k := range req.Keys {
			if !validatePropKey(k) {
				jsonError(w, "invalid property key: "+k, http.StatusBadRequest)
				return
			}
		}
		idField := db.IDField(req.Label)

		// Build SET n.key = null for each key (removes the property)
		nullSets := make([]string, len(req.Keys))
		for i, k := range req.Keys {
			nullSets[i] = fmt.Sprintf("n.%s = null", k)
		}
		setClause := strings.Join(nullSets, ", ")

		query := fmt.Sprintf(`
UNWIND $ids AS id
MATCH (n:%s {%s: id})
SET %s
RETURN n`, req.Label, idField, setClause)

		rows, err := database.Write(r.Context(), query, map[string]interface{}{"ids": req.IDs})
		if err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		nodes := make([]interface{}, 0)
		for _, row := range rows {
			nodes = append(nodes, row["n"])
		}
		jsonOKCount(w, nodes, len(nodes))
	}
}

// DELETE /api/nodes — delete 1 or multiple nodes (DETACH)
func DeleteNodes(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.DeleteNodesRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			jsonError(w, "invalid body", http.StatusBadRequest)
			return
		}
		if !validateLabel(req.Label) || len(req.IDs) == 0 {
			jsonError(w, "label and ids required", http.StatusBadRequest)
			return
		}
		idField := db.IDField(req.Label)
		query := fmt.Sprintf(`
UNWIND $ids AS id
MATCH (n:%s {%s: id})
DETACH DELETE n
RETURN count(*) AS deleted`, req.Label, idField)

		rows, err := database.Write(r.Context(), query, map[string]interface{}{"ids": req.IDs})
		if err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		deleted := int64(0)
		if len(rows) > 0 {
			deleted = toInt64(rows[0]["deleted"])
		}
		jsonOK(w, map[string]interface{}{"deleted": deleted})
	}
}

// helpers

func jsonOK(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.Response{Success: true, Data: data})
}

func jsonOKCount(w http.ResponseWriter, data interface{}, count int) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.Response{Success: true, Data: data, Count: count})
}

func jsonError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(models.Response{Success: false, Error: msg})
}

func toInt64(v interface{}) int64 {
	switch val := v.(type) {
	case int64:
		return val
	case float64:
		return int64(val)
	case int:
		return int64(val)
	}
	return 0
}
