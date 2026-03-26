package com.afkir.workflow.plugin.builtin.task;

import com.afkir.workflow.plugin.meta.Plugin;
import com.afkir.workflow.plugin.meta.PropertyDoc;
import com.afkir.workflow.plugin.runtime.RunContext;
import com.afkir.workflow.plugin.task.FlowableResult;
import com.afkir.workflow.plugin.task.FlowableTask;
import com.afkir.workflow.plugin.task.SubTaskDefinition;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Plugin(
    id = "io.workflowplatform.builtin.Switch",
    version = "1.0.0",
    description = "Branches to one of N case lists based on a string value (the n-way sibling of If)"
)
@Component
public class Switch implements FlowableTask<Switch.Input> {

    public record Input(
        @PropertyDoc(description = "Pebble expression; matched against case keys by string equality")
        @NotNull
        String value,
        @PropertyDoc(description = "Map of case key -> tasks to run when value equals that key")
        @NotNull
        Map<String, List<TaskSpec>> cases,
        
        @JsonProperty("default")
        @PropertyDoc(description = "Tasks to run when no case matches")
        List<TaskSpec> defaultBranch
    ) {}

    public record TaskSpec(String id, String type, Map<String, Object> config) {}

    @Override
    public FlowableResult evaluate(RunContext<Input> ctx) {
        var input = ctx.input();

        String value = input.value();

        List<TaskSpec> branch = null;
        if (value != null && input.cases() != null) {
            branch = input.cases().get(value);
        }
        if (branch == null) {
            branch = input.defaultBranch();
        }

        if (branch == null || branch.isEmpty()) {
            return new FlowableResult.Complete(Map.of("matched", value == null ? "" : value));
        }

        var subTasks = branch.stream()
            .map(t -> new SubTaskDefinition(t.id(), t.type(), t.config(), Map.of()))
            .toList();

        return new FlowableResult.SpawnTasks(subTasks, null);
    }

}
