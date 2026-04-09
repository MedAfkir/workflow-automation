package com.afkir.workflow.app.execution.dto;

import java.time.Instant;
import java.util.UUID;

public record ExecutionSummaryResponse(
        UUID id,
        UUID workflowId,
        String workflowKey,
        String workflowNamespace,
        int workflowRevision,
        String state,
        String triggerType,
        UUID triggerId,
        String errorMessage,
        Instant startedAt,
        Instant endedAt,
        Instant createdAt) {
}
