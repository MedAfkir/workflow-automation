package com.afkir.workflow.engine.execution;

import com.afkir.workflow.domain.task.TaskDefinition;

import java.util.Map;
import java.util.UUID;

public record ScheduledStep(
        TaskDefinition taskDef,
        UUID parentTaskRunId,
        Integer iteration,
        Map<String, Object> contextOverrides
) {

    public ScheduledStep {
        if (taskDef == null) {
            throw new IllegalArgumentException("taskDef required");
        }
        contextOverrides = contextOverrides == null ? Map.of() : Map.copyOf(contextOverrides);
    }

    public boolean isRoot() {
        return parentTaskRunId == null;
    }

    public static ScheduledStep root(TaskDefinition taskDef) {
        return new ScheduledStep(taskDef, null, null, Map.of());
    }

    public static ScheduledStep child(TaskDefinition taskDef,
                                      UUID parentTaskRunId,
                                      Integer iteration,
                                      Map<String, Object> contextOverrides) {
        return new ScheduledStep(taskDef, parentTaskRunId, iteration, contextOverrides);
    }
}
