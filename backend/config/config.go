package config

import "os"

type Config struct {
	Neo4jURI      string
	Neo4jUsername string
	Neo4jPassword string
	Neo4jDatabase string
	Port          string
}

func Load() *Config {
	return &Config{
		Neo4jURI:      getEnv("NEO4J_URI", "neo4j+s://localhost:7687"),
		Neo4jUsername: getEnv("NEO4J_USERNAME", "neo4j"),
		Neo4jPassword: getEnv("NEO4J_PASSWORD", "password"),
		Neo4jDatabase: getEnv("NEO4J_DATABASE", "neo4j"),
		Port:          getEnv("PORT", "8080"),
	}
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
