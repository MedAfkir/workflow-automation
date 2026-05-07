package cmd

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/medafkir/workflow-automation/cli/internal/client"
)

const minimalWorkflowYAML = `namespace: cli-test
key: hello
tasks:
  - id: greet
    type: io.workflowplatform.builtin.Log
    config:
      message: hi
`

func TestApplyHappyPath(t *testing.T) {
	var got client.CreateWorkflowRequest
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" || r.URL.Path != "/api/v1/workflows" {
			t.Errorf("unexpected request: %s %s", r.Method, r.URL.Path)
		}
		if ct := r.Header.Get("Content-Type"); !strings.HasPrefix(ct, "application/json") {
			t.Errorf("expected application/json, got %q", ct)
		}
		body, _ := io.ReadAll(r.Body)
		if err := json.Unmarshal(body, &got); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(client.WorkflowDetailResponse{
			ID:              "00000000-0000-0000-0000-000000000001",
			Namespace:       "cli-test",
			Key:             "hello",
			Enabled:         true,
			CurrentRevision: 1,
		})
	}))
	t.Cleanup(ts.Close)

	tmp := filepath.Join(t.TempDir(), "wf.yaml")
	if err := os.WriteFile(tmp, []byte(minimalWorkflowYAML), 0o600); err != nil {
		t.Fatal(err)
	}

	stdout, _, err := runCLI(t, ts, "apply", tmp)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	mustContain(t, stdout, "Workflow created")
	mustContain(t, stdout, "00000000-0000-0000-0000-000000000001")
	mustContain(t, stdout, "revision 1")

	if got.YAML != minimalWorkflowYAML {
		t.Errorf("server received wrong YAML: %q", got.YAML)
	}
}

func TestApplyLintFails(t *testing.T) {
	tmp := filepath.Join(t.TempDir(), "bad.yaml")
	if err := os.WriteFile(tmp, []byte("namespace: x\n"), 0o600); err != nil {
		t.Fatal(err)
	}

	stdout, stderr, err := runCLI(t, nil, "apply", tmp)
	if err == nil {
		t.Fatalf("expected error, got stdout=%q", stdout)
	}
	if !errors.Is(err, errLint) {
		t.Fatalf("expected errLint sentinel, got %v", err)
	}
	mustContain(t, stderr, "Lint failed")
	mustContain(t, stderr, "missing required key: key")
	mustContain(t, stderr, "missing required key: tasks")
}

func TestApplyServerConflict(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict)
		_ = json.NewEncoder(w).Encode(client.APIError{
			Code:    "WORKFLOW_ALREADY_EXISTS",
			Message: "workflow cli-test/hello already exists",
		})
	}))
	t.Cleanup(ts.Close)

	tmp := filepath.Join(t.TempDir(), "wf.yaml")
	if err := os.WriteFile(tmp, []byte(minimalWorkflowYAML), 0o600); err != nil {
		t.Fatal(err)
	}

	_, _, err := runCLI(t, ts, "apply", tmp)
	if err == nil {
		t.Fatalf("expected server error, got nil")
	}
	var srvErr *client.ServerError
	if !errors.As(err, &srvErr) {
		t.Fatalf("expected *client.ServerError, got %T: %v", err, err)
	}
	if srvErr.Code != "WORKFLOW_ALREADY_EXISTS" {
		t.Errorf("expected code WORKFLOW_ALREADY_EXISTS, got %q", srvErr.Code)
	}
}
