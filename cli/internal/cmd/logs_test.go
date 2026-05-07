package cmd

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestLogsTailParsesSSEEvents(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasSuffix(r.URL.Path, "/logs/stream") {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "text/event-stream")
		w.WriteHeader(http.StatusOK)
		flusher, _ := w.(http.Flusher)

		writeEvent := func(id int, level, message string) {
			fmt.Fprintf(w,
				"id: %d\nevent: log\ndata: {\"id\":%d,\"executionId\":\"exec-1\",\"taskRunId\":null,\"level\":%q,\"message\":%q,\"loggedAt\":\"2026-05-14T10:00:00Z\"}\n\n",
				id, id, level, message)
			if flusher != nil {
				flusher.Flush()
			}
		}

		writeEvent(1, "INFO", "task started: greet")
		fmt.Fprintln(w, ": ping")
		fmt.Fprintln(w) 
		writeEvent(2, "INFO", "hello world")
		writeEvent(3, "INFO", "task completed: greet")
		
	}))
	t.Cleanup(ts.Close)

	stdout, _, err := runCLI(t, ts, "logs", "tail", "exec-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	for _, want := range []string{
		"[INFO] task started: greet",
		"[INFO] hello world",
		"[INFO] task completed: greet",
	} {
		mustContain(t, stdout, want)
	}
}

func TestLogsTailServerError(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"EXECUTION_NOT_FOUND","message":"no such execution","timestamp":"2026-05-14T10:00:00Z"}`)
	}))
	t.Cleanup(ts.Close)

	_, _, err := runCLI(t, ts, "logs", "tail", "missing")
	if err == nil {
		t.Fatal("expected error")
	}
	mustContain(t, err.Error(), "EXECUTION_NOT_FOUND")
}
