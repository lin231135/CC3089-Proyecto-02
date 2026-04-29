package models

// Generic API response
type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Count   int         `json:"count,omitempty"`
}

// Node requests
type CreateNodeRequest struct {
	Labels     []string               `json:"labels"`
	Properties map[string]interface{} `json:"properties"`
}

type UpdatePropertiesRequest struct {
	Label      string                 `json:"label"`
	IDs        []string               `json:"ids"`
	Properties map[string]interface{} `json:"properties"`
}

type RemovePropertiesRequest struct {
	Label string   `json:"label"`
	IDs   []string `json:"ids"`
	Keys  []string `json:"keys"`
}

type DeleteNodesRequest struct {
	Label string   `json:"label"`
	IDs   []string `json:"ids"`
}

// Relationship requests
type CreateRelationshipRequest struct {
	Type       string                 `json:"type"`
	FromLabel  string                 `json:"fromLabel"`
	FromID     string                 `json:"fromId"`
	ToLabel    string                 `json:"toLabel"`
	ToID       string                 `json:"toId"`
	Properties map[string]interface{} `json:"properties"`
}

type UpdateRelPropertiesRequest struct {
	ElementIDs []string               `json:"elementIds"`
	Properties map[string]interface{} `json:"properties"`
}

type RemoveRelPropertiesRequest struct {
	ElementIDs []string `json:"elementIds"`
	Keys       []string `json:"keys"`
}

type DeleteRelationshipsRequest struct {
	ElementIDs []string `json:"elementIds"`
}
