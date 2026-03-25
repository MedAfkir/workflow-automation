package com.afkir.workflow.plugin.runtime;

import java.time.Instant;
import java.util.UUID;


public record ExecutionInfo(
        UUID executionId,
        UUID taskRunId,
        String workflowNamespace,
        String workflowKey,
        int workflowRevision,
        String taskId,
        int attemptNumber,
        Instant scheduledAt
) {
    
    public String idempotencyKey() {
        return taskRunId + ":" + attemptNumber;
    }
}