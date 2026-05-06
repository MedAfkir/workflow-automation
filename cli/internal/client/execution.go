package client

import "context"

func (c *Client) CreateExecution(ctx context.Context, workflowID string, inputs map[string]string) (*ExecutionResponse, error) {
	req := CreateExecutionRequest{WorkflowID: workflowID, Inputs: inputs}
	var out ExecutionResponse
	if err := c.do(ctx, "POST", "/api/v1/executions", req, &out); err != nil {
		return nil, err
	}
	return &out, nil
}
