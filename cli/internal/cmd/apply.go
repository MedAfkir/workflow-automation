package cmd

import (
	"context"
	"errors"
	"fmt"
	"os"

	"github.com/medafkir/workflow-automation/cli/internal/lint"
	"github.com/spf13/cobra"
)

var errLint = errors.New("lint failed")

var applyCmd = &cobra.Command{
	Use:   "apply <file.yaml>",
	Short: "Create a workflow from a YAML file.",
	Long: `Validate a workflow YAML structurally, then POST it to the server.

Note: apply creates only. Re-running on the same namespace/key returns
409 WORKFLOW_ALREADY_EXISTS - use the API directly to update.`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		data, err := os.ReadFile(args[0])
		if err != nil {
			return fmt.Errorf("read %s: %w", args[0], err)
		}

		if issues := lint.Lint(data); len(issues) > 0 {
			fmt.Fprintln(cmd.ErrOrStderr(), "Lint failed:")
			for _, i := range issues {
				fmt.Fprintln(cmd.ErrOrStderr(), "  -", i)
			}
			return errLint
		}

		wf, err := newClient().CreateWorkflow(context.Background(), string(data))
		if err != nil {
			return err
		}
		fmt.Fprintf(cmd.OutOrStdout(), "Workflow created: %s (revision %d)\n", wf.ID, wf.CurrentRevision)
		return nil
	},
}
