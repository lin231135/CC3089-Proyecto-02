package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"ecommerce-neo4j/config"
	"ecommerce-neo4j/internal/db"
	"ecommerce-neo4j/internal/handlers"

	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {
	// Load .env from the directory containing the binary or the working dir
	godotenv.Load(".env")

	cfg := config.Load()

	database, err := db.New(cfg.Neo4jURI, cfg.Neo4jUsername, cfg.Neo4jPassword, cfg.Neo4jDatabase)
	if err != nil {
		log.Fatalf("Failed to connect to Neo4j: %v", err)
	}
	defer database.Close(context.Background())

	log.Println("Connected to Neo4j AuraDB")

	if err := database.InitConstraints(context.Background()); err != nil {
		log.Printf("Warning: constraints init: %v", err)
	}

	mux := http.NewServeMux()

	// ── Nodes ──────────────────────────────────────────────────────────────
	mux.HandleFunc("POST /api/nodes", handlers.CreateNode(database))
	mux.HandleFunc("GET /api/nodes", handlers.GetNodes(database))
	mux.HandleFunc("GET /api/nodes/{id}", handlers.GetNodeByID(database))
	mux.HandleFunc("PATCH /api/nodes/properties", handlers.UpdateNodeProperties(database))
	mux.HandleFunc("DELETE /api/nodes/properties", handlers.RemoveNodeProperties(database))
	mux.HandleFunc("DELETE /api/nodes", handlers.DeleteNodes(database))

	// ── Relationships ──────────────────────────────────────────────────────
	mux.HandleFunc("POST /api/relationships", handlers.CreateRelationship(database))
	mux.HandleFunc("GET /api/relationships", handlers.GetRelationships(database))
	mux.HandleFunc("PATCH /api/relationships/properties", handlers.UpdateRelProperties(database))
	mux.HandleFunc("DELETE /api/relationships/properties", handlers.RemoveRelProperties(database))
	mux.HandleFunc("DELETE /api/relationships", handlers.DeleteRelationships(database))

	// ── Import ─────────────────────────────────────────────────────────────
	mux.HandleFunc("POST /api/import/csv", handlers.ImportCSV(database))

	// ── Queries & Stats ────────────────────────────────────────────────────
	mux.HandleFunc("GET /api/stats", handlers.GetStats(database))
	mux.HandleFunc("GET /api/recommendations/{userId}", handlers.GetRecommendations(database))
	mux.HandleFunc("GET /api/queries/{name}", handlers.RunNamedQuery(database))
	mux.HandleFunc("GET /api/graph/verify", handlers.VerifyConnected(database))
	mux.HandleFunc("DELETE /api/graph/isolated", handlers.DeleteIsolatedNodes(database))

	// ── Health ─────────────────────────────────────────────────────────────
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintln(w, `{"status":"ok"}`)
	})

	// Serve frontend static files if the frontend/dist directory exists
	frontendDir := "../frontend/dist"
	if _, err := os.Stat(frontendDir); err == nil {
		mux.Handle("/", http.FileServer(http.Dir(frontendDir)))
	}

	handler := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS", "PUT"},
		AllowedHeaders: []string{"Content-Type", "Authorization"},
	}).Handler(logMiddleware(mux))

	addr := ":" + cfg.Port
	log.Printf("Server running on http://localhost%s", addr)
	log.Fatal(http.ListenAndServe(addr, handler))
}

func logMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api") {
			log.Printf("%s %s", r.Method, r.URL.Path)
		}
		next.ServeHTTP(w, r)
	})
}
