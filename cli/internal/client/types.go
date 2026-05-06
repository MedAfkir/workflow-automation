package client

import "time"

type CreateWorkflowRequest struct {
	YAML string `json:"yaml"`
}

type WorkflowDetailResponse struct {
	ID              string    `json:"id"`
	Namespace       string    `json:"namespace"`
	Key             string    `json:"key"`
	Enabled         bool      `json:"enabled"`
	CurrentRevision int       `json:"currentRevision"`
	SourceYAML      string    `json:"sourceYaml"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

type CreateExecutionRequest struct {
	WorkflowID string            `json:"workflowId"`
	Inputs     map[string]string `json:"inputs,omitempty"`
}

type ExecutionResponse struct {
	ID                 string         `json:"id"`
	WorkflowID         string         `json:"workflowId"`
	WorkflowRevisionID string         `json:"workflowRevisionId"`
	WorkflowKey        string         `json:"workflowKey"`
	WorkflowNamespace  string         `json:"workflowNamespace"`
	WorkflowRevision   int            `json:"workflowRevision"`
	State              string         `json:"state"`
	TriggerType        string         `json:"triggerType"`
	TriggerID          *string        `json:"triggerId"`
	Inputs             map[string]any `json:"inputs"`
	Outputs            map[string]any `json:"outputs"`
	ErrorMessage       string         `json:"errorMessage"`
	StartedAt          *time.Time     `json:"startedAt"`
	EndedAt            *time.Time     `json:"endedAt"`
	CreatedAt          time.Time      `json:"createdAt"`
}

type LogEvent struct {
	ID          int64     `json:"id"`
	ExecutionID string    `json:"executionId"`
	TaskRunID   *string   `json:"taskRunId"`
	Level       string    `json:"level"`
	Message     string    `json:"message"`
	LoggedAt    time.Time `json:"loggedAt"`
}

type APIError struct {
	Code      string    `json:"code"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
}
