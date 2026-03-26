package com.afkir.workflow.plugin.builtin.task;

import com.afkir.workflow.plugin.meta.Plugin;
import com.afkir.workflow.plugin.meta.PropertyDoc;
import com.afkir.workflow.plugin.runtime.RunContext;
import com.afkir.workflow.plugin.task.FlowableResult;
import com.afkir.workflow.plugin.task.FlowableTask;
import com.afkir.workflow.plugin.task.SubTaskDefinition;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Plugin(id = "io.workflowplatform.builtin.ForEach", version = "1.0.0")
@Component
public class ForEach implements FlowableTask<ForEach.Input> {

    public record Input(
            @PropertyDoc(description = "List to iterate over")
            @NotNull
            List<Object> values,
            @PropertyDoc(description = "Max parallel iterations", defaultValue = "1")
            Integer concurrency,
            @PropertyDoc(description = "Tasks to execute per item")
            @NotNull
            List<TaskSpec> tasks
    ) {
    }

    public record TaskSpec(String id, String type, Map<String, Object> config) {
    }

    @Override
    public FlowableResult evaluate(RunContext<Input> ctx) {
        var input = ctx.input();
        var subTasks = new java.util.ArrayList<SubTaskDefinition>();

        for (int i = 0; i < input.values().size(); i++) {
            var item = input.values().get(i);
            var iterCtx = Map.<String, Object>of("value", item, "index", i);

            for (var spec : input.tasks()) {
                subTasks.add(new SubTaskDefinition(
                        spec.id() + "_" + i,
                        spec.type(),
                        spec.config(),
                        iterCtx
                ));
            }
        }

        var concurrency = input.concurrency() == null ? 1 : input.concurrency();
        return new FlowableResult.SpawnTasks(subTasks, concurrency);
    }

}
