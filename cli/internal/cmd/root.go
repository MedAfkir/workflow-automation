package cmd

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"os"
	"os/signal"

	"github.com/medafkir/workflow-automation/cli/internal/client"
	"github.com/spf13/cobra"
)

var serverURL string

var rootCmd = &cobra.Command{
	Use:           "wf",
	Short:         "wf is the workflow-automation CLI.",
	Long:          "wf talks to a workflow-automation server over HTTP. Use it to push workflow YAML, trigger executions, and tail logs.",
	SilenceUsage:  true, 
	SilenceErrors: true, 
}

func init() {
	rootCmd.PersistentFlags().StringVar(&serverURL, "server-url", defaultServerURL(),
		"Workflow server base URL (env WF_SERVER_URL)")

	rootCmd.AddCommand(applyCmd, triggerCmd, logsCmd)
}

func defaultServerURL() string {
	if v := os.Getenv("WF_SERVER_URL"); v != "" {
		return v
	}
	return "http://localhost:8080"
}

func newClient() *client.Client { return client.New(serverURL) }

func signalContext() (context.Context, context.CancelFunc) {
	return signal.NotifyContext(context.Background(), os.Interrupt)
}

func Execute() {
	err := rootCmd.Execute()
	if err == nil {
		return
	}
	if errors.Is(err, context.Canceled) {
		
		fmt.Fprintln(os.Stderr)
		os.Exit(130)
	}
	fmt.Fprintln(os.Stderr, "Error:", err)

	var serverErr *client.ServerError
	if errors.As(err, &serverErr) {
		os.Exit(2)
	}
	var urlErr *url.Error
	if errors.As(err, &urlErr) {
		os.Exit(3)
	}
	os.Exit(1)
}
