package com.afkir.workflow.engine.dispatch;

import java.time.Duration;

public record LeaseContext(String workerId, Duration ttl) {

    public LeaseContext {
        if (workerId == null || workerId.isBlank()) {
            throw new IllegalArgumentException("workerId required");
        }
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            throw new IllegalArgumentException("ttl must be positive");
        }
    }
}
