package com.afkir.workflow.app.workflow.dto;

import java.time.Instant;
import java.util.UUID;

public record WorkflowResponse(
        UUID id,
        String namespace,
        String key,
        UUID currentRevisionId,
        int currentRevision,
        boolean enabled,
        Instant createdAt,
        Instant updatedAt
) {
}
