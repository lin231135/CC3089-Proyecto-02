package handlers

import (
	"encoding/csv"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"ecommerce-neo4j/internal/db"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

type colType int

const (
	colString colType = iota
	colFloat
	colInt
	colBool
	colDate
	colList
)

type colDef struct {
	name    string
	colType colType
}

// csvSchema defines column types for each import type.
var csvSchema = map[string][]colDef{
	"users": {
		{"userId", colString}, {"name", colString}, {"email", colString},
		{"birthDate", colDate}, {"isPremium", colBool}, {"interests", colList},
		{"totalSpent", colFloat}, {"createdAt", colDate},
	},
	"products": {
		{"productId", colString}, {"name", colString}, {"description", colString},
		{"price", colFloat}, {"stock", colInt}, {"tags", colList},
		{"isActive", colBool}, {"createdAt", colDate},
	},
	"categories": {
		{"categoryId", colString}, {"name", colString}, {"description", colString},
		{"level", colInt}, {"isActive", colBool}, {"imageUrl", colString}, {"createdAt", colDate},
	},
	"orders": {
		{"orderId", colString}, {"status", colString}, {"total", colFloat},
		{"placedAt", colDate}, {"deliveredAt", colDate}, {"isPaid", colBool}, {"notes", colString},
	},
	"reviews": {
		{"reviewId", colString}, {"rating", colInt}, {"comment", colString},
		{"createdAt", colDate}, {"isVerified", colBool}, {"helpfulVotes", colInt}, {"sentiment", colString},
	},
	"sellers": {
		{"sellerId", colString}, {"name", colString}, {"email", colString},
		{"rating", colFloat}, {"joinedAt", colDate}, {"isVerified", colBool}, {"country", colString},
	},
}

// nodeLabel maps import type to Neo4j label
var nodeLabel = map[string]string{
	"users":      "User",
	"products":   "Product",
	"categories": "Category",
	"orders":     "Order",
	"reviews":    "Review",
	"sellers":    "Seller",
}

// relSchema maps rel import types to Cypher templates and column definitions
type relSchema struct {
	fromLabel string
	fromField string
	fromCol   string
	toLabel   string
	toField   string
	toCol     string
	relType   string
	props     []colDef
}

var relSchemas = map[string]relSchema{
	"rel_purchased": {
		"User", "userId", "userId",
		"Product", "productId", "productId",
		"PURCHASED",
		[]colDef{{"purchasedAt", colDate}, {"quantity", colInt}, {"unitPrice", colFloat}},
	},
	"rel_wrote": {
		"User", "userId", "userId",
		"Review", "reviewId", "reviewId",
		"WROTE",
		[]colDef{{"createdAt", colDate}, {"verified", colBool}, {"platform", colString}},
	},
	"rel_about": {
		"Review", "reviewId", "reviewId",
		"Product", "productId", "productId",
		"ABOUT",
		[]colDef{{"rating", colInt}, {"sentiment", colString}, {"helpfulVotes", colInt}},
	},
	"rel_viewed": {
		"User", "userId", "userId",
		"Product", "productId", "productId",
		"VIEWED",
		[]colDef{{"viewedAt", colDate}, {"duration", colInt}, {"source", colString}},
	},
	"rel_added_to_cart": {
		"User", "userId", "userId",
		"Product", "productId", "productId",
		"ADDED_TO_CART",
		[]colDef{{"addedAt", colDate}, {"quantity", colInt}, {"savedForLater", colBool}},
	},
	"rel_belongs_to": {
		"Product", "productId", "productId",
		"Category", "categoryId", "categoryId",
		"BELONGS_TO",
		[]colDef{{"assignedAt", colDate}, {"isPrimary", colBool}, {"rank", colInt}},
	},
	"rel_similar_to": {
		"Product", "productId", "fromProductId",
		"Product", "productId", "toProductId",
		"SIMILAR_TO",
		[]colDef{{"similarityScore", colFloat}, {"algorithm", colString}, {"computedAt", colDate}},
	},
	"rel_placed": {
		"User", "userId", "userId",
		"Order", "orderId", "orderId",
		"PLACED",
		[]colDef{{"placedAt", colDate}, {"channel", colString}, {"promoCode", colString}},
	},
	"rel_contains": {
		"Order", "orderId", "orderId",
		"Product", "productId", "productId",
		"CONTAINS",
		[]colDef{{"quantity", colInt}, {"unitPrice", colFloat}, {"discount", colFloat}},
	},
	"rel_sells": {
		"Seller", "sellerId", "sellerId",
		"Product", "productId", "productId",
		"SELLS",
		[]colDef{{"listedAt", colDate}, {"sellerPrice", colFloat}, {"isActive", colBool}},
	},
	"rel_follows": {
		"User", "userId", "userId",
		"Seller", "sellerId", "sellerId",
		"FOLLOWS",
		[]colDef{{"followedAt", colDate}, {"notifications", colBool}, {"tier", colString}},
	},
	"rel_recommended_to": {
		"Product", "productId", "productId",
		"User", "userId", "userId",
		"RECOMMENDED_TO",
		[]colDef{{"score", colFloat}, {"algorithm", colString}, {"generatedAt", colDate}},
	},
	"rel_subcategory_of": {
		"Category", "categoryId", "fromCategoryId",
		"Category", "categoryId", "toCategoryId",
		"SUBCATEGORY_OF",
		[]colDef{{"createdAt", colDate}, {"rank", colInt}, {"isActive", colBool}},
	},
}

// POST /api/import/csv
// Form fields: type (string), file (CSV file)
func ImportCSV(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseMultipartForm(32 << 20); err != nil {
			jsonError(w, "cannot parse form: "+err.Error(), http.StatusBadRequest)
			return
		}

		importType := strings.TrimSpace(r.FormValue("type"))
		if importType == "" {
			jsonError(w, "type field required", http.StatusBadRequest)
			return
		}

		file, _, err := r.FormFile("file")
		if err != nil {
			jsonError(w, "file required: "+err.Error(), http.StatusBadRequest)
			return
		}
		defer file.Close()

		reader := csv.NewReader(file)
		reader.LazyQuotes = true
		reader.TrimLeadingSpace = true

		headers, err := reader.Read()
		if err != nil {
			jsonError(w, "cannot read CSV headers: "+err.Error(), http.StatusBadRequest)
			return
		}
		// normalize headers
		for i, h := range headers {
			headers[i] = strings.TrimSpace(h)
		}

		// Read all rows
		var allRows [][]string
		for {
			row, err := reader.Read()
			if err == io.EOF {
				break
			}
			if err != nil {
				continue
			}
			allRows = append(allRows, row)
		}

		var imported int
		var importErr error

		if schema, ok := csvSchema[importType]; ok {
			label := nodeLabel[importType]
			imported, importErr = importNodes(r, database, headers, allRows, schema, label)
		} else if rs, ok := relSchemas[importType]; ok {
			imported, importErr = importRelationships(r, database, headers, allRows, rs)
		} else {
			jsonError(w, "unknown type: "+importType, http.StatusBadRequest)
			return
		}

		if importErr != nil {
			jsonError(w, importErr.Error(), http.StatusInternalServerError)
			return
		}
		jsonOK(w, map[string]interface{}{"imported": imported, "type": importType})
	}
}

func importNodes(r *http.Request, database *db.DB, headers []string, rows [][]string, schema []colDef, label string) (int, error) {
	batchSize := 500
	total := 0

	// Build column index map
	colIdx := make(map[string]int, len(headers))
	for i, h := range headers {
		colIdx[h] = i
	}

	// Build MERGE query with all props from schema
	setParts := make([]string, 0)
	for _, col := range schema {
		if col.name == idColForLabel(label) {
			continue // handled in MERGE
		}
		setParts = append(setParts, fmt.Sprintf("n.%s = row.%s", col.name, col.name))
	}
	idField := idColForLabel(label)
	query := fmt.Sprintf(`
UNWIND $rows AS row
MERGE (n:%s {%s: row.%s})
SET %s
RETURN count(n) AS cnt`, label, idField, idField, strings.Join(setParts, ", "))

	for i := 0; i < len(rows); i += batchSize {
		end := i + batchSize
		if end > len(rows) {
			end = len(rows)
		}
		batch := rows[i:end]

		params := make([]map[string]interface{}, 0, len(batch))
		for _, row := range batch {
			rowMap := parseRow(headers, row, schema, colIdx)
			params = append(params, rowMap)
		}

		result, err := database.Write(r.Context(), query, map[string]interface{}{"rows": params})
		if err != nil {
			return total, err
		}
		if len(result) > 0 {
			total += int(toInt64(result[0]["cnt"]))
		}
	}
	return total, nil
}

func importRelationships(r *http.Request, database *db.DB, headers []string, rows [][]string, rs relSchema) (int, error) {
	batchSize := 500
	total := 0

	colIdx := make(map[string]int, len(headers))
	for i, h := range headers {
		colIdx[h] = i
	}

	// Build prop assignments
	setParts := make([]string, 0, len(rs.props))
	for _, p := range rs.props {
		setParts = append(setParts, fmt.Sprintf("r.%s = row.%s", p.name, p.name))
	}

	query := fmt.Sprintf(`
UNWIND $rows AS row
MATCH (a:%s {%s: row.%s}), (b:%s {%s: row.%s})
MERGE (a)-[r:%s]->(b)
SET %s
RETURN count(r) AS cnt`,
		rs.fromLabel, rs.fromField, rs.fromCol,
		rs.toLabel, rs.toField, rs.toCol,
		rs.relType,
		strings.Join(setParts, ", "))

	// Build a combined schema for parsing
	allCols := []colDef{
		{rs.fromCol, colString},
		{rs.toCol, colString},
	}
	allCols = append(allCols, rs.props...)

	for i := 0; i < len(rows); i += batchSize {
		end := i + batchSize
		if end > len(rows) {
			end = len(rows)
		}
		batch := rows[i:end]

		params := make([]map[string]interface{}, 0, len(batch))
		for _, row := range batch {
			rowMap := parseRow(headers, row, allCols, colIdx)
			params = append(params, rowMap)
		}

		result, err := database.Write(r.Context(), query, map[string]interface{}{"rows": params})
		if err != nil {
			return total, err
		}
		if len(result) > 0 {
			total += int(toInt64(result[0]["cnt"]))
		}
	}
	return total, nil
}

func parseRow(headers []string, row []string, schema []colDef, colIdx map[string]int) map[string]interface{} {
	result := make(map[string]interface{})
	for _, col := range schema {
		idx, ok := colIdx[col.name]
		if !ok {
			continue
		}
		raw := ""
		if idx < len(row) {
			raw = strings.TrimSpace(row[idx])
		}
		result[col.name] = convertCol(raw, col.colType)
	}
	return result
}

func convertCol(raw string, ct colType) interface{} {
	if raw == "" {
		switch ct {
		case colFloat:
			return 0.0
		case colInt:
			return int64(0)
		case colBool:
			return false
		case colList:
			return []string{}
		case colDate:
			return nil
		default:
			return ""
		}
	}
	switch ct {
	case colFloat:
		v, _ := strconv.ParseFloat(raw, 64)
		return v
	case colInt:
		v, _ := strconv.ParseInt(raw, 10, 64)
		return v
	case colBool:
		return strings.EqualFold(raw, "true") || raw == "1"
	case colDate:
		if t, err := time.Parse("2006-01-02", raw); err == nil {
			return neo4j.DateOf(t)
		}
		return nil
	case colList:
		parts := strings.Split(raw, "|")
		cleaned := make([]string, 0, len(parts))
		for _, p := range parts {
			if s := strings.TrimSpace(p); s != "" {
				cleaned = append(cleaned, s)
			}
		}
		return cleaned
	default:
		return raw
	}
}

func idColForLabel(label string) string {
	switch label {
	case "User":
		return "userId"
	case "Product":
		return "productId"
	case "Category":
		return "categoryId"
	case "Order":
		return "orderId"
	case "Review":
		return "reviewId"
	case "Seller":
		return "sellerId"
	}
	return "id"
}
