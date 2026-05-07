package cmd

import (
	"bytes"
	"net/http/httptest"
	"strings"
	"testing"
)

func runCLI(t *testing.T, ts *httptest.Server, args ...string) (stdout, stderr string, err error) {
	t.Helper()
	var out, errBuf bytes.Buffer
	rootCmd.SetOut(&out)
	rootCmd.SetErr(&errBuf)

	full := append([]string{}, args...)
	if ts != nil {
		full = append(full, "--server-url", ts.URL)
	}
	rootCmd.SetArgs(full)
	err = rootCmd.Execute()
	return out.String(), errBuf.String(), err
}

func mustContain(t *testing.T, haystack, needle string) {
	t.Helper()
	if !strings.Contains(haystack, needle) {
		t.Fatalf("expected substring %q, got: %s", needle, haystack)
	}
}
