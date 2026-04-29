package db

import (
	"context"
	"fmt"
	"time"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

type DB struct {
	driver   neo4j.DriverWithContext
	database string
}

func New(uri, username, password, database string) (*DB, error) {
	driver, err := neo4j.NewDriverWithContext(uri, neo4j.BasicAuth(username, password, ""))
	if err != nil {
		return nil, err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := driver.VerifyConnectivity(ctx); err != nil {
		return nil, fmt.Errorf("cannot connect to Neo4j: %w", err)
	}
	return &DB{driver: driver, database: database}, nil
}

func (d *DB) Close(ctx context.Context) {
	d.driver.Close(ctx)
}

func (d *DB) Session(ctx context.Context) neo4j.SessionWithContext {
	return d.driver.NewSession(ctx, neo4j.SessionConfig{DatabaseName: d.database})
}

func (d *DB) Write(ctx context.Context, query string, params map[string]interface{}) ([]map[string]interface{}, error) {
	session := d.Session(ctx)
	defer session.Close(ctx)

	result, err := session.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		res, err := tx.Run(ctx, query, params)
		if err != nil {
			return nil, err
		}
		return collectRecords(ctx, res)
	})
	if err != nil {
		return nil, err
	}
	return result.([]map[string]interface{}), nil
}

func (d *DB) Read(ctx context.Context, query string, params map[string]interface{}) ([]map[string]interface{}, error) {
	session := d.Session(ctx)
	defer session.Close(ctx)

	result, err := session.ExecuteRead(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		res, err := tx.Run(ctx, query, params)
		if err != nil {
			return nil, err
		}
		return collectRecords(ctx, res)
	})
	if err != nil {
		return nil, err
	}
	return result.([]map[string]interface{}), nil
}

func collectRecords(ctx context.Context, result neo4j.ResultWithContext) ([]map[string]interface{}, error) {
	var rows []map[string]interface{}
	for result.Next(ctx) {
		record := result.Record()
		row := make(map[string]interface{})
		for _, key := range record.Keys {
			val, _ := record.Get(key)
			row[key] = convertFromNeo4j(val)
		}
		rows = append(rows, row)
	}
	return rows, result.Err()
}

func convertFromNeo4j(v interface{}) interface{} {
	switch val := v.(type) {
	case neo4j.Node:
		return nodeToMap(val)
	case neo4j.Relationship:
		return relToMap(val)
	case neo4j.Date:
		return val.Time().Format("2006-01-02")
	case neo4j.LocalDateTime:
		return val.Time().Format(time.RFC3339)
	case neo4j.Time:
		return val.Time().Format("15:04:05")
	case []interface{}:
		result := make([]interface{}, len(val))
		for i, item := range val {
			result[i] = convertFromNeo4j(item)
		}
		return result
	default:
		return val
	}
}

func nodeToMap(node neo4j.Node) map[string]interface{} {
	m := make(map[string]interface{})
	for k, v := range node.Props {
		m[k] = convertFromNeo4j(v)
	}
	m["_elementId"] = node.ElementId
	m["_labels"] = node.Labels
	return m
}

func relToMap(rel neo4j.Relationship) map[string]interface{} {
	m := make(map[string]interface{})
	for k, v := range rel.Props {
		m[k] = convertFromNeo4j(v)
	}
	m["_elementId"] = rel.ElementId
	m["_type"] = rel.Type
	m["_startElementId"] = rel.StartElementId
	m["_endElementId"] = rel.EndElementId
	return m
}

// ConvertToNeo4j converts JSON-decoded values to Neo4j-appropriate types.
// Strings matching YYYY-MM-DD are converted to neo4j.Date.
func ConvertToNeo4j(v interface{}) interface{} {
	switch val := v.(type) {
	case string:
		if t, err := time.Parse("2006-01-02", val); err == nil {
			return neo4j.DateOf(t)
		}
		return val
	case []interface{}:
		result := make([]string, 0, len(val))
		for _, item := range val {
			result = append(result, fmt.Sprintf("%v", item))
		}
		return result
	default:
		return val
	}
}

func ConvertPropsToNeo4j(props map[string]interface{}) map[string]interface{} {
	out := make(map[string]interface{}, len(props))
	for k, v := range props {
		out[k] = ConvertToNeo4j(v)
	}
	return out
}

// InitConstraints creates uniqueness constraints and indexes.
func (d *DB) InitConstraints(ctx context.Context) error {
	queries := []string{
		"CREATE CONSTRAINT user_id IF NOT EXISTS FOR (n:User) REQUIRE n.userId IS UNIQUE",
		"CREATE CONSTRAINT product_id IF NOT EXISTS FOR (n:Product) REQUIRE n.productId IS UNIQUE",
		"CREATE CONSTRAINT category_id IF NOT EXISTS FOR (n:Category) REQUIRE n.categoryId IS UNIQUE",
		"CREATE CONSTRAINT order_id IF NOT EXISTS FOR (n:Order) REQUIRE n.orderId IS UNIQUE",
		"CREATE CONSTRAINT review_id IF NOT EXISTS FOR (n:Review) REQUIRE n.reviewId IS UNIQUE",
		"CREATE CONSTRAINT seller_id IF NOT EXISTS FOR (n:Seller) REQUIRE n.sellerId IS UNIQUE",
		"CREATE INDEX product_price IF NOT EXISTS FOR (n:Product) ON (n.price)",
		"CREATE INDEX product_name IF NOT EXISTS FOR (n:Product) ON (n.name)",
		"CREATE INDEX user_email IF NOT EXISTS FOR (n:User) ON (n.email)",
	}
	session := d.Session(ctx)
	defer session.Close(ctx)
	for _, q := range queries {
		_, err := session.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
			return tx.Run(ctx, q, nil)
		})
		if err != nil {
			return fmt.Errorf("constraint error (%s): %w", q, err)
		}
	}
	return nil
}

// IDField returns the primary key field name for a given label.
func IDField(label string) string {
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
	default:
		return "id"
	}
}
