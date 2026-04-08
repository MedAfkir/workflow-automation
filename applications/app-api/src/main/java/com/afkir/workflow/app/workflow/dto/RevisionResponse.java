package com.afkir.workflow.app.workflow.dto;

import java.time.Instant;
import java.util.UUID;

public record RevisionResponse(
        UUID id,
        int revision,
        String hash,
        Instant createdAt
) {
}
