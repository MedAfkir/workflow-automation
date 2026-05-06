package client

import (
	"bufio"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"
)

func (c *Client) StreamLogs(ctx context.Context, executionID string, onEvent func(LogEvent)) error {
	req, err := http.NewRequestWithContext(ctx, "GET",
		c.ServerURL+"/api/v1/executions/"+executionID+"/logs/stream", nil)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "text/event-stream")

	resp, err := c.HTTP.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		var apiErr APIError
		if json.Unmarshal(body, &apiErr) == nil && apiErr.Code != "" {
			return &ServerError{Status: resp.StatusCode, Code: apiErr.Code, Message: apiErr.Message}
		}
		return &ServerError{Status: resp.StatusCode, RawBody: string(body)}
	}

	scanner := bufio.NewScanner(resp.Body)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)

	var dataLines []string
	flush := func() {
		if len(dataLines) == 0 {
			return
		}
		payload := strings.Join(dataLines, "\n")
		dataLines = dataLines[:0]
		var evt LogEvent
		if err := json.Unmarshal([]byte(payload), &evt); err != nil {
			return 
		}
		onEvent(evt)
	}

	for scanner.Scan() {
		line := scanner.Text()
		if line == "" {
			flush()
			continue
		}
		if strings.HasPrefix(line, ":") {
			continue
		}
		if strings.HasPrefix(line, "data:") {
			dataLines = append(dataLines, strings.TrimPrefix(strings.TrimPrefix(line, "data:"), " "))
		}
	}
	flush()

	if err := scanner.Err(); err != nil {
		if ctx.Err() != nil {
			return ctx.Err()
		}
		return err
	}
	return nil
}
