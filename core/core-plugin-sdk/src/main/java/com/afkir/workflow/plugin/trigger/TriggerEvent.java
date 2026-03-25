package com.afkir.workflow.plugin.trigger;

import java.time.Instant;
import java.util.Map;


public record TriggerEvent(
        String source,
        Map<String, Object> payload,
        Instant receivedAt
) {
}