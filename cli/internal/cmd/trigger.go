package cmd

import (
	"context"
	"fmt"

	"github.com/medafkir/workflow-automation/cli/internal/inputs"
	"github.com/spf13/cobra"
)

var triggerInputs []string

var triggerCmd = &cobra.Command{
	Use:   "trigger <workflow-id>",
	Short: "Queue an execution for a workflow.",
	Long: `POST /api/v1/executions to create a new execution.
The server returns immediately (202 ACCEPTED); the execution runs asynchronously.
Use 'wf logs tail <execution-id>' to follow it.`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		kv, err := inputs.ParseKV(triggerInputs)
		if err != nil {
			return err
		}

		exec, err := newClient().CreateExecution(context.Background(), args[0], kv)
		if err != nil {
			return err
		}
		fmt.Fprintf(cmd.OutOrStdout(), "Execution created: %s\n", exec.ID)
		return nil
	},
}

func init() {
	triggerCmd.Flags().StringArrayVar(&triggerInputs, "input", nil,
		"Input key=value (repeatable). Values are strings.")
}
