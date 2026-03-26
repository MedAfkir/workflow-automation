package com.afkir.workflow.plugin.builtin.task;

import com.afkir.workflow.plugin.meta.Plugin;
import com.afkir.workflow.plugin.meta.PropertyDoc;
import com.afkir.workflow.plugin.runtime.RunContext;
import com.afkir.workflow.plugin.task.FlowableResult;
import com.afkir.workflow.plugin.task.FlowableTask;
import com.afkir.workflow.plugin.task.SubTaskDefinition;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Plugin(
    id = "io.workflowplatform.builtin.If",
    version = "1.0.0",
    description = "Branches based on a boolean condition"
)
@Component
public class If implements FlowableTask<If.Input> {

    public record Input(
        @PropertyDoc(description = "Pebble expression evaluating to true/false")
        @NotBlank
        String condition,
        @PropertyDoc(description = "Tasks to run if condition is true")
        List<TaskSpec> then,
        
        @JsonProperty("else")
        @PropertyDoc(description = "Tasks to run if condition is false")
        List<TaskSpec> elseBranch
    ) {}

    public record TaskSpec(String id, String type, Map<String, Object> config) {}

    @Override
    public FlowableResult evaluate(RunContext<Input> ctx) {
        
        boolean result = Boolean.parseBoolean(ctx.input().condition());

        var branch = result ? ctx.input().then() : ctx.input().elseBranch();
        if (branch == null || branch.isEmpty()) {
            return new FlowableResult.Complete(Map.of("matched", result));
        }

        var subTasks = branch.stream()
            .map(t -> new SubTaskDefinition(t.id(), t.type(), t.config(), Map.of()))
            .toList();

        return new FlowableResult.SpawnTasks(subTasks, null);
    }

}
