package com.afkir.workflow.app.workflow.dto;

import java.time.Instant;
import java.util.UUID;

public record WorkflowSummaryResponse(
        UUID id,
        String namespace,
        String key,
        boolean enabled,
        int currentRevision,
        int triggerCount,
        Instant updatedAt
) {
}
