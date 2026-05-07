package lint

import (
	"bytes"
	"fmt"

	"gopkg.in/yaml.v3"
)

type Issue struct {
	Line    int
	Message string
}

func (i Issue) String() string {
	if i.Line > 0 {
		return fmt.Sprintf("line %d: %s", i.Line, i.Message)
	}
	return i.Message
}

func Lint(data []byte) []Issue {
	if len(bytes.TrimSpace(data)) == 0 {
		return []Issue{{Message: "YAML is empty"}}
	}

	var doc yaml.Node
	if err := yaml.Unmarshal(data, &doc); err != nil {
		return []Issue{{Message: err.Error()}}
	}
	if doc.Kind != yaml.DocumentNode || len(doc.Content) == 0 {
		return []Issue{{Message: "YAML is empty"}}
	}

	root := doc.Content[0]
	if root.Kind != yaml.MappingNode {
		return []Issue{{Line: root.Line, Message: "top-level YAML must be a mapping"}}
	}

	var issues []Issue

	if v := findScalar(root, "namespace"); v == nil || v.Value == "" {
		issues = append(issues, Issue{Line: root.Line, Message: "missing required key: namespace"})
	}
	if v := findScalar(root, "key"); v == nil || v.Value == "" {
		issues = append(issues, Issue{Line: root.Line, Message: "missing required key: key"})
	}

	tasks := findValue(root, "tasks")
	switch {
	case tasks == nil:
		issues = append(issues, Issue{Line: root.Line, Message: "missing required key: tasks"})
	case tasks.Kind != yaml.SequenceNode:
		issues = append(issues, Issue{Line: tasks.Line, Message: "tasks must be a sequence"})
	case len(tasks.Content) == 0:
		issues = append(issues, Issue{Line: tasks.Line, Message: "tasks must contain at least one task"})
	default:
		issues = append(issues, lintTasks(tasks)...)
	}

	return issues
}

func findValue(mapping *yaml.Node, key string) *yaml.Node {
	for i := 0; i+1 < len(mapping.Content); i += 2 {
		if mapping.Content[i].Value == key {
			return mapping.Content[i+1]
		}
	}
	return nil
}

func findScalar(mapping *yaml.Node, key string) *yaml.Node {
	v := findValue(mapping, key)
	if v == nil || v.Kind != yaml.ScalarNode {
		return nil
	}
	return v
}

func lintTasks(tasks *yaml.Node) []Issue {
	var issues []Issue
	firstSeen := make(map[string]int)
	for _, t := range tasks.Content {
		if t.Kind != yaml.MappingNode {
			issues = append(issues, Issue{Line: t.Line, Message: "task entry must be a mapping"})
			continue
		}
		id := findScalar(t, "id")
		typ := findScalar(t, "type")
		if id == nil || id.Value == "" {
			issues = append(issues, Issue{Line: t.Line, Message: "task missing required field: id"})
		}
		if typ == nil || typ.Value == "" {
			issues = append(issues, Issue{Line: t.Line, Message: "task missing required field: type"})
		}
		if id != nil && id.Value != "" {
			if prev, dup := firstSeen[id.Value]; dup {
				issues = append(issues, Issue{
					Line:    id.Line,
					Message: fmt.Sprintf("duplicate task id %q (first seen at line %d)", id.Value, prev),
				})
			} else {
				firstSeen[id.Value] = id.Line
			}
		}
	}
	return issues
}
