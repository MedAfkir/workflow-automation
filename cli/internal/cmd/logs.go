package cmd

import (
	"fmt"

	"github.com/medafkir/workflow-automation/cli/internal/client"
	"github.com/spf13/cobra"
)

var logsCmd = &cobra.Command{
	Use:   "logs",
	Short: "Inspect execution logs.",
}

var logsTailCmd = &cobra.Command{
	Use:   "tail <execution-id>",
	Short: "Stream an execution's logs live (SSE).",
	Long: `Connects to GET /api/v1/executions/<id>/logs/stream and prints each event
to stdout. Backlog (persisted log lines) is replayed first, then live events
flow as they arrive. Press Ctrl-C to stop.

The server caps a single SSE connection at 30 minutes; re-run this command
to resume (events since execution start are replayed on reconnect).`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		ctx, cancel := signalContext()
		defer cancel()

		out := cmd.OutOrStdout()
		c := newClient()
		return c.StreamLogs(ctx, args[0], func(e client.LogEvent) {
			fmt.Fprintf(out, "%s [%s] %s\n", e.LoggedAt.Format("15:04:05.000"), e.Level, e.Message)
		})
	},
}

func init() {
	logsCmd.AddCommand(logsTailCmd)
}
