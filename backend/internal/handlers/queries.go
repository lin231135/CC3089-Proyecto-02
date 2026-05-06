package handlers

import (
	"net/http"

	"ecommerce-neo4j/internal/db"
)

// GET /api/stats
func GetStats(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		// Node counts per label
		countQuery := `
MATCH (n)
RETURN labels(n)[0] AS label, count(n) AS total
ORDER BY total DESC`

		// Top 5 most purchased products
		topProductsQuery := `
MATCH (u:User)-[p:PURCHASED]->(pr:Product)
RETURN pr.productId AS id, pr.name AS name, sum(p.quantity) AS totalQty
ORDER BY totalQty DESC LIMIT 5`

		// Average order total
		avgOrderQuery := `
MATCH (o:Order)
RETURN avg(o.total) AS avgTotal, min(o.total) AS minTotal, max(o.total) AS maxTotal, count(o) AS totalOrders`

		// Most active buyers
		topBuyersQuery := `
MATCH (u:User)-[:PURCHASED]->(:Product)
RETURN u.userId AS userId, u.name AS name, count(*) AS purchases
ORDER BY purchases DESC LIMIT 5`

		// Relationship type counts
		relCountQuery := `
MATCH ()-[r]->()
RETURN type(r) AS relType, count(r) AS total
ORDER BY total DESC`

		nodeCounts, err1 := database.Read(ctx, countQuery, nil)
		topProducts, err2 := database.Read(ctx, topProductsQuery, nil)
		avgOrder, err3 := database.Read(ctx, avgOrderQuery, nil)
		topBuyers, err4 := database.Read(ctx, topBuyersQuery, nil)
		relCounts, err5 := database.Read(ctx, relCountQuery, nil)

		if err1 != nil || err2 != nil || err3 != nil || err4 != nil || err5 != nil {
			jsonError(w, "stats query failed", http.StatusInternalServerError)
			return
		}

		jsonOK(w, map[string]interface{}{
			"nodeCounts":  nodeCounts,
			"topProducts": topProducts,
			"orderStats":  avgOrder,
			"topBuyers":   topBuyers,
			"relCounts":   relCounts,
		})
	}
}

// GET /api/recommendations/{userId}
// Collaborative filtering: products bought by similar users that this user hasn't bought.
func GetRecommendations(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userId := r.PathValue("userId")
		if userId == "" {
			jsonError(w, "userId required", http.StatusBadRequest)
			return
		}
		query := `
MATCH (u:User {userId: $userId})-[:PURCHASED]->(p:Product)<-[:PURCHASED]-(similar:User)-[:PURCHASED]->(rec:Product)
WHERE NOT (u)-[:PURCHASED]->(rec)
  AND rec.isActive = true
WITH rec, count(*) AS score
ORDER BY score DESC
LIMIT 10
MATCH (s:Seller)-[:SELLS]->(rec)
RETURN rec.productId AS productId, rec.name AS name, rec.price AS price,
       rec.description AS description, score, collect(DISTINCT s.name)[0] AS seller`

		rows, err := database.Read(r.Context(), query, map[string]interface{}{"userId": userId})
		if err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if rows == nil {
			rows = []map[string]interface{}{}
		}
		jsonOKCount(w, rows, len(rows))
	}
}

// GET /api/queries/{name}
// Named Cypher queries for the presentation (6 total, 2 per integrante).
func RunNamedQuery(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		name := r.PathValue("name")
		ctx := r.Context()
		q := r.URL.Query()

		switch name {

		// === Integrante 1 ===

		case "top-sellers-by-volume":
			// Top 5 sellers por volumen total de ventas
			query := `
MATCH (s:Seller)-[sell:SELLS]->(p:Product)<-[c:CONTAINS]-(o:Order)
RETURN s.sellerId AS sellerId, s.name AS sellerName, s.country AS country,
       count(DISTINCT o) AS orders, sum(c.quantity * c.unitPrice) AS totalRevenue
ORDER BY totalRevenue DESC LIMIT 5`
			rows, err := database.Read(ctx, query, nil)
			if err != nil {
				jsonError(w, err.Error(), http.StatusInternalServerError)
				return
			}
			jsonOK(w, rows)

		case "top-products-by-sales":
			// Top productos más vendidos por cantidad total
			query := `
MATCH (p:Product)<-[c:CONTAINS]-(o:Order)
WITH p, sum(c.quantity) AS totalSold, count(DISTINCT o) AS orderCount
ORDER BY totalSold DESC LIMIT 10
RETURN p.productId AS productId, p.name AS name, p.price AS price,
       p.description AS description, p.stock AS stock, totalSold, orderCount`
			rows, err := database.Read(ctx, query, nil)
			if err != nil {
				jsonError(w, err.Error(), http.StatusInternalServerError)
				return
			}
			jsonOK(w, rows)

		case "collab-filter":
			// Filtrado colaborativo por usuario
			userId := q.Get("userId")
			if userId == "" {
				jsonError(w, "userId required", http.StatusBadRequest)
				return
			}
			query := `
MATCH (u:User {userId: $userId})-[:PURCHASED]->(p:Product)<-[:PURCHASED]-(similar:User)-[:PURCHASED]->(rec:Product)
WHERE NOT (u)-[:PURCHASED]->(rec) AND rec.isActive = true
WITH rec, count(DISTINCT similar) AS sharedUsers
ORDER BY sharedUsers DESC LIMIT 10
RETURN rec.productId AS productId, rec.name AS name, rec.price AS price, sharedUsers`
			rows, err := database.Read(ctx, query, map[string]interface{}{"userId": userId})
			if err != nil {
				jsonError(w, err.Error(), http.StatusInternalServerError)
				return
			}
			jsonOK(w, rows)

		// === Integrante 2 ===

		case "avg-rating-by-category":
			// Promedio de rating por categoría y subcategoría
			query := `
MATCH (cat:Category)<-[:BELONGS_TO]-(p:Product)<-[:ABOUT]-(rev:Review)
WITH cat, avg(rev.rating) AS avgRating, count(rev) AS reviewCount
OPTIONAL MATCH (sub:Category)-[:SUBCATEGORY_OF]->(cat)
RETURN cat.categoryId AS categoryId, cat.name AS category, cat.level AS level,
       round(avgRating * 100) / 100 AS avgRating, reviewCount,
       collect(DISTINCT sub.name) AS subcategories
ORDER BY avgRating DESC`
			rows, err := database.Read(ctx, query, nil)
			if err != nil {
				jsonError(w, err.Error(), http.StatusInternalServerError)
				return
			}
			jsonOK(w, rows)

		case "also-bought":
			// Usuarios que compraron producto X también compraron Y
			productId := q.Get("productId")
			if productId == "" {
				jsonError(w, "productId required", http.StatusBadRequest)
				return
			}
			query := `
MATCH (:User)-[:PURCHASED]->(p:Product {productId: $productId})
WITH p
MATCH (u:User)-[:PURCHASED]->(p), (u)-[:PURCHASED]->(other:Product)
WHERE other.productId <> p.productId
WITH other, count(DISTINCT u) AS buyers
ORDER BY buyers DESC LIMIT 10
RETURN other.productId AS productId, other.name AS name, other.price AS price, buyers`
			rows, err := database.Read(ctx, query, map[string]interface{}{"productId": productId})
			if err != nil {
				jsonError(w, err.Error(), http.StatusInternalServerError)
				return
			}
			jsonOK(w, rows)

		// === Integrante 3 ===

		case "similar-products":
			// Productos similares a los vistos recientemente por un usuario
			userId := q.Get("userId")
			if userId == "" {
				jsonError(w, "userId required", http.StatusBadRequest)
				return
			}
			query := `
MATCH (u:User {userId: $userId})-[v:VIEWED]->(p:Product)-[s:SIMILAR_TO]->(rec:Product)
WHERE NOT (u)-[:PURCHASED]->(rec) AND rec.isActive = true
WITH rec, max(s.similarityScore) AS simScore
ORDER BY simScore DESC LIMIT 10
RETURN rec.productId AS productId, rec.name AS name, rec.price AS price,
       round(simScore * 100) / 100 AS similarityScore`
			rows, err := database.Read(ctx, query, map[string]interface{}{"userId": userId})
			if err != nil {
				jsonError(w, err.Error(), http.StatusInternalServerError)
				return
			}
			jsonOK(w, rows)

		case "products-without-reviews":
			// Productos sin ninguna review
			query := `
MATCH (p:Product)
WHERE NOT (:Review)-[:ABOUT]->(p)
RETURN p.productId AS productId, p.name AS name, p.price AS price,
       p.isActive AS isActive, p.stock AS stock
ORDER BY p.name
LIMIT 50`
			rows, err := database.Read(ctx, query, nil)
			if err != nil {
				jsonError(w, err.Error(), http.StatusInternalServerError)
				return
			}
			jsonOK(w, rows)

		default:
			jsonError(w, "unknown query: "+name, http.StatusNotFound)
		}
	}
}

// DELETE /api/graph/isolated — delete all isolated nodes
func DeleteIsolatedNodes(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		query := `MATCH (n) WHERE NOT EXISTS { (n)--() } 
		WITH n, labels(n) AS lbls, properties(n) AS props
		DELETE n 
		RETURN count(*) AS deleted, collect(lbls)[0..10] AS deletedLabels`

		rows, err := database.Write(r.Context(), query, nil)
		if err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}

		deleted := int64(0)
		if len(rows) > 0 {
			deleted = toInt64(rows[0]["deleted"])
		}

		jsonOK(w, map[string]interface{}{
			"deleted": deleted,
			"message": "Isolated nodes deleted successfully",
		})
	}
}

// GET /api/graph/verify — verify all nodes have at least 1 relationship
func VerifyConnected(database *db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		query := `MATCH (n) WHERE NOT EXISTS { (n)--() } RETURN count(n) AS isolated`
		rows, err := database.Read(r.Context(), query, nil)
		if err != nil {
			jsonError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		isolated := int64(0)
		if len(rows) > 0 {
			isolated = toInt64(rows[0]["isolated"])
		}

		// Get details of isolated nodes if any
		var isolatedNodes []map[string]interface{}
		if isolated > 0 {
			detailQuery := `MATCH (n) WHERE NOT EXISTS { (n)--() } RETURN n LIMIT 10`
			detailRows, _ := database.Read(r.Context(), detailQuery, nil)
			if detailRows != nil {
				isolatedNodes = detailRows
			}
		}

		jsonOK(w, map[string]interface{}{
			"isolated":      isolated,
			"connected":     isolated == 0,
			"isolatedNodes": isolatedNodes,
		})
	}
}
