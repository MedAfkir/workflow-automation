package com.afkir.workflow.app.trigger;

import java.time.Instant;
import java.util.UUID;

public record TriggerResponse(
        UUID id,
        String triggerId,
        String type,
        boolean enabled,
        Instant nextEvaluationAt,
        String webhookUrl,                
        String errorMessage
) {
}