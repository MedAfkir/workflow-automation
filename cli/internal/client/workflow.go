package client

import "context"

func (c *Client) CreateWorkflow(ctx context.Context, yamlSource string) (*WorkflowDetailResponse, error) {
	var out WorkflowDetailResponse
	if err := c.do(ctx, "POST", "/api/v1/workflows", CreateWorkflowRequest{YAML: yamlSource}, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
