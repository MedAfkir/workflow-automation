package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

type Client struct {
	ServerURL string
	HTTP      *http.Client
}

func New(serverURL string) *Client {
	return &Client{
		ServerURL: strings.TrimRight(serverURL, "/"),
		HTTP:      &http.Client{}, 
	}
}

type ServerError struct {
	Status  int
	Code    string
	Message string
	RawBody string
}

func (e *ServerError) Error() string {
	if e.Code != "" {
		return fmt.Sprintf("server %d %s: %s", e.Status, e.Code, e.Message)
	}
	if e.RawBody != "" {
		return fmt.Sprintf("server %d: %s", e.Status, strings.TrimSpace(e.RawBody))
	}
	return fmt.Sprintf("server %d", e.Status)
}

func (c *Client) do(ctx context.Context, method, path string, body, out any) error {
	var reqBody io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("encode request: %w", err)
		}
		reqBody = bytes.NewReader(b)
	}
	req, err := http.NewRequestWithContext(ctx, method, c.ServerURL+path, reqBody)
	if err != nil {
		return err
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	req.Header.Set("Accept", "application/json")

	resp, err := c.HTTP.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode >= 400 {
		var apiErr APIError
		if json.Unmarshal(respBody, &apiErr) == nil && apiErr.Code != "" {
			return &ServerError{Status: resp.StatusCode, Code: apiErr.Code, Message: apiErr.Message}
		}
		return &ServerError{Status: resp.StatusCode, RawBody: string(respBody)}
	}

	if out != nil {
		if err := json.Unmarshal(respBody, out); err != nil {
			return fmt.Errorf("decode response: %w", err)
		}
	}
	return nil
}
