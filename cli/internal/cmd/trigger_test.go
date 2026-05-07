package cmd

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/medafkir/workflow-automation/cli/internal/client"
)

func TestTriggerHappyPath(t *testing.T) {
	var got client.CreateExecutionRequest
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" || r.URL.Path != "/api/v1/executions" {
			t.Errorf("unexpected request: %s %s", r.Method, r.URL.Path)
		}
		body, _ := io.ReadAll(r.Body)
		if err := json.Unmarshal(body, &got); err != nil {
			t.Fatalf("decode request: %v", err)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)
		_ = json.NewEncoder(w).Encode(client.ExecutionResponse{
			ID:               "exec-abc",
			WorkflowID:       got.WorkflowID,
			State:            "CREATED",
			WorkflowRevision: 1,
		})
	}))
	t.Cleanup(ts.Close)

	stdout, _, err := runCLI(t, ts, "trigger", "wf-1", "--input", "name=Mehdi", "--input", "count=3")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	mustContain(t, stdout, "Execution created: exec-abc")

	if got.WorkflowID != "wf-1" {
		t.Errorf("workflowId: got %q", got.WorkflowID)
	}
	if got.Inputs["name"] != "Mehdi" || got.Inputs["count"] != "3" {
		t.Errorf("inputs: got %#v", got.Inputs)
	}
}

func TestTriggerBadInputFormat(t *testing.T) {
	_, _, err := runCLI(t, nil, "trigger", "wf-1", "--input", "no-equals-sign")
	if err == nil {
		t.Fatalf("expected error for malformed --input")
	}
}
