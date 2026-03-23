package com.afkir.workflow.domain.task;

import java.util.List;
import java.util.Map;

public record TaskDefinition(
        TaskId id,
        String type,
        Map<String, Object> config,
        RetryPolicy retryPolicy,
        String timeout,
        List<TaskId> dependsOn,
        ErrorHandling onError,
        boolean allowFailure
) {

    public TaskDefinition {
        if (id == null) {
            throw new IllegalArgumentException("Task id required");
        }
        if (type == null || type.isBlank()) {
            throw new IllegalArgumentException("Task type required");
        }
        config = config == null ? Map.of() : Map.copyOf(config);
        
        if (dependsOn != null) dependsOn = List.copyOf(dependsOn);
    }

    public static TaskDefinition of(TaskId id, String type, Map<String, Object> config,
                                    RetryPolicy retry, String timeout) {
        return new TaskDefinition(id, type, config, retry, timeout, null, null, false);
    }

    public boolean hasImplicitDependency() {
        return dependsOn == null;
    }

    public List<TaskId> effectiveDependsOn(TaskId previousTaskId) {
        if (dependsOn != null) return dependsOn;
        return previousTaskId == null ? List.of() : List.of(previousTaskId);
    }
}
