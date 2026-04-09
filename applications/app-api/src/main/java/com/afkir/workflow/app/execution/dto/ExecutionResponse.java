package com.afkir.workflow.app.execution.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record ExecutionResponse(
        UUID id,
        UUID workflowId,
        UUID workflowRevisionId,
        String workflowKey,
        String workflowNamespace,
        int workflowRevision,
        String state,
        String triggerType,
        UUID triggerId,
        Map<String, Object> inputs,
        Map<String, Object> outputs,
        String errorMessage,
        Instant startedAt,
        Instant endedAt,
        Instant createdAt) {
}
