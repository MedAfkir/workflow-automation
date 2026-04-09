package com.afkir.workflow.app.execution.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record TaskRunResponse(
        UUID id,
        String taskId,
        String taskType,
        int sequence,
        String state,
        int attempt,
        
        int maxAttempts,
        
        UUID parentTaskRunId,
        
        Integer iteration,
        
        List<String> dependsOn,
        
        boolean explicitDependencies,
        Map<String, Object> inputs,
        Map<String, Object> outputs,
        String errorMessage,
        String errorCode,
        Instant startedAt,
        Instant endedAt) {
}
