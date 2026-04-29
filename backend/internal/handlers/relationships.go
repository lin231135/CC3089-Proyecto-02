package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"ecommerce-neo4j/internal/db"
	"ecommerce-neo4j/internal/models"
)

// POST /api/relationships
func CreateRelationship(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.CreateRelationshipRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			jsonError(w, "invalid body", http.StatusBadRequest)
			return
		}
		if !validateLabel(req.FromLabel) || !validateLabel(req.ToLabel) || !validateLabel(req.Type) {
			jsonError(w, "invalid label or type", http.StatusBadRequest)
			return
		}
		fromID := db.IDField(req.FromLabel)
		toID := db.IDField(req.ToLabel)
		props := db.ConvertPropsToNeo4j(req.Properties)

		query := fmt.Sprintf(`
MATCH (a:%s {%s: $fromId}), (b:%s {%s: $toId})
CREATE (a)-[r:%s $props]->(b)
RETURN r`, req.FromLabel, fromID, req.ToLabel, toID, req.Type)

		rows, err := database.Write(r.Context(), query, map[string]interface{}{
			"fromId": req.FromID,
			"toId":   req.ToID,
			"props":  props,
		})
		if err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if len(rows) == 0 {
			jsonError(w, "nodes not found", http.StatusNotFound)
			return
		}
		jsonOK(w, rows[0]["r"])
	}
}

// GET /api/relationships?type=PURCHASED&limit=20&skip=0
func GetRelationships(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		relType := r.URL.Query().Get("type")
		fromLabel := r.URL.Query().Get("fromLabel")
		toLabel := r.URL.Query().Get("toLabel")
		limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
		if limit <= 0 {
			limit = 20
		}
		skip, _ := strconv.Atoi(r.URL.Query().Get("skip"))

		fromPart := "n"
		toPart := "m"
		relPart := "r"
		if fromLabel != "" && validateLabel(fromLabel) {
			fromPart = fmt.Sprintf("n:%s", fromLabel)
		}
		if toLabel != "" && validateLabel(toLabel) {
			toPart = fmt.Sprintf("m:%s", toLabel)
		}
		if relType != "" && validateLabel(relType) {
			relPart = fmt.Sprintf("r:%s", relType)
		}

		query := fmt.Sprintf("MATCH (%s)-[%s]->(%s) RETURN r SKIP $skip LIMIT $limit", fromPart, relPart, toPart)
		rows, err := database.Read(r.Context(), query, map[string]interface{}{"skip": skip, "limit": limit})
		if err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		rels := make([]interface{}, 0)
		for _, row := range rows {
			rels = append(rels, row["r"])
		}
		jsonOKCount(w, rels, len(rels))
	}
}

// PATCH /api/relationships/properties — update/add props to 1 or multiple rels by elementId
func UpdateRelProperties(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.UpdateRelPropertiesRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			jsonError(w, "invalid body", http.StatusBadRequest)
			return
		}
		if len(req.ElementIDs) == 0 || len(req.Properties) == 0 {
			jsonError(w, "elementIds and properties required", http.StatusBadRequest)
			return
		}
		props := db.ConvertPropsToNeo4j(req.Properties)

		query := `
UNWIND $elementIds AS eid
MATCH ()-[r]->() WHERE elementId(r) = eid
SET r += $props
RETURN r`

		rows, err := database.Write(r.Context(), query, map[string]interface{}{
			"elementIds": req.ElementIDs,
			"props":      props,
		})
		if err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		rels := make([]interface{}, 0)
		for _, row := range rows {
			rels = append(rels, row["r"])
		}
		jsonOKCount(w, rels, len(rels))
	}
}

// DELETE /api/relationships/properties — remove props from 1 or multiple rels
func RemoveRelProperties(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.RemoveRelPropertiesRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			jsonError(w, "invalid body", http.StatusBadRequest)
			return
		}
		if len(req.ElementIDs) == 0 || len(req.Keys) == 0 {
			jsonError(w, "elementIds and keys required", http.StatusBadRequest)
			return
		}
		for _, k := range req.Keys {
			if !validatePropKey(k) {
				jsonError(w, "invalid key: "+k, http.StatusBadRequest)
				return
			}
		}

		nullSets := make([]string, len(req.Keys))
		for i, k := range req.Keys {
			nullSets[i] = fmt.Sprintf("r.%s = null", k)
		}
		setClause := strings.Join(nullSets, ", ")

		query := fmt.Sprintf(`
UNWIND $elementIds AS eid
MATCH ()-[r]->() WHERE elementId(r) = eid
SET %s
RETURN r`, setClause)

		rows, err := database.Write(r.Context(), query, map[string]interface{}{"elementIds": req.ElementIDs})
		if err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		rels := make([]interface{}, 0)
		for _, row := range rows {
			rels = append(rels, row["r"])
		}
		jsonOKCount(w, rels, len(rels))
	}
}

// DELETE /api/relationships — delete 1 or multiple relationships by elementId
func DeleteRelationships(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.DeleteRelationshipsRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			jsonError(w, "invalid body", http.StatusBadRequest)
			return
		}
		if len(req.ElementIDs) == 0 {
			jsonError(w, "elementIds required", http.StatusBadRequest)
			return
		}

		query := `
UNWIND $elementIds AS eid
MATCH ()-[r]->() WHERE elementId(r) = eid
DELETE r
RETURN count(*) AS deleted`

		rows, err := database.Write(r.Context(), query, map[string]interface{}{"elementIds": req.ElementIDs})
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
