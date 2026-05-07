package lint

import (
	"strings"
	"testing"
)

func TestLint(t *testing.T) {
	cases := []struct {
		name      string
		yaml      string
		wantPass  bool
		wantMatch string 
	}{
		{
			name:      "empty",
			yaml:      "",
			wantMatch: "empty",
		},
		{
			name:      "whitespace only",
			yaml:      "   \n\t\n",
			wantMatch: "empty",
		},
		{
			name:      "top-level sequence",
			yaml:      "- namespace: x\n- key: y\n",
			wantMatch: "top-level YAML must be a mapping",
		},
		{
			name:      "missing namespace",
			yaml:      "key: hello\ntasks:\n  - id: a\n    type: T\n",
			wantMatch: "namespace",
		},
		{
			name:      "missing key",
			yaml:      "namespace: demo\ntasks:\n  - id: a\n    type: T\n",
			wantMatch: "missing required key: key",
		},
		{
			name:      "missing tasks",
			yaml:      "namespace: demo\nkey: hello\n",
			wantMatch: "missing required key: tasks",
		},
		{
			name:      "tasks not a sequence",
			yaml:      "namespace: demo\nkey: hello\ntasks: foo\n",
			wantMatch: "tasks must be a sequence",
		},
		{
			name:      "empty tasks",
			yaml:      "namespace: demo\nkey: hello\ntasks: []\n",
			wantMatch: "at least one task",
		},
		{
			name:      "task missing id",
			yaml:      "namespace: demo\nkey: hello\ntasks:\n  - type: T\n",
			wantMatch: "task missing required field: id",
		},
		{
			name:      "task missing type",
			yaml:      "namespace: demo\nkey: hello\ntasks:\n  - id: a\n",
			wantMatch: "task missing required field: type",
		},
		{
			name:      "duplicate task ids",
			yaml:      "namespace: demo\nkey: hello\ntasks:\n  - id: same\n    type: T\n  - id: same\n    type: T\n",
			wantMatch: "duplicate task id",
		},
		{
			name:     "valid minimal",
			yaml:     "namespace: demo\nkey: hello\ntasks:\n  - id: greet\n    type: io.workflowplatform.builtin.Log\n",
			wantPass: true,
		},
		{
			name: "valid with optional fields",
			yaml: `namespace: demo
key: full
description: a workflow
errorHandling: fail-fast
concurrency:
  max: 5
tasks:
  - id: a
    type: io.workflowplatform.builtin.Log
    config:
      message: hi
  - id: b
    type: io.workflowplatform.builtin.Log
    dependsOn: [a]
`,
			wantPass: true,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			issues := Lint([]byte(tc.yaml))
			if tc.wantPass {
				if len(issues) > 0 {
					t.Fatalf("expected no issues, got %v", issues)
				}
				return
			}
			if len(issues) == 0 {
				t.Fatalf("expected an issue containing %q, got none", tc.wantMatch)
			}
			if !containsAny(issues, tc.wantMatch) {
				t.Fatalf("expected an issue containing %q, got %v", tc.wantMatch, issues)
			}
		})
	}
}

func TestLintReportsLineForDuplicateId(t *testing.T) {
	yaml := "namespace: x\nkey: y\ntasks:\n  - id: dup\n    type: T\n  - id: dup\n    type: T\n"
	issues := Lint([]byte(yaml))
	var found bool
	for _, i := range issues {
		if strings.Contains(i.Message, "duplicate task id") {
			if i.Line == 0 {
				t.Fatalf("duplicate-id issue missing line number: %v", i)
			}
			found = true
		}
	}
	if !found {
		t.Fatalf("did not find duplicate-id issue in %v", issues)
	}
}

func containsAny(issues []Issue, sub string) bool {
	for _, i := range issues {
		if strings.Contains(i.Message, sub) {
			return true
		}
	}
	return false
}
