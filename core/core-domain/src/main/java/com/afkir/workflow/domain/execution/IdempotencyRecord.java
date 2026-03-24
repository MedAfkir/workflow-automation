package com.afkir.workflow.domain.execution;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public record IdempotencyRecord(
        String key,
        String namespace,
        UUID executionId,
        Instant createdAt,
        Instant expiresAt
) {
}