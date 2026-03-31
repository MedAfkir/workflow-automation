package com.afkir.workflow.infra.secrets.api.dto;

import java.time.Instant;
import java.util.UUID;

public record SecretSummaryResponse(
        UUID id,
        String namespace,
        String key,
        int version,
        Instant createdAt,
        Instant updatedAt
) {
}
