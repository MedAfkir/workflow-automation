package com.afkir.workflow.app.workflow.dto;

import java.time.Instant;
import java.util.UUID;

public record WorkflowDetailResponse(
        UUID id,
        String namespace,
        String key,
        boolean enabled,
        int currentRevision,
        String sourceYaml,
        Instant createdAt,
        Instant updatedAt
) {
}
