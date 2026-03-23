package com.afkir.workflow.domain.task;

import java.time.Duration;
import java.util.concurrent.ThreadLocalRandom;

public record RetryPolicy(
        BackoffType type,
        String initialInterval,
        String maxInterval,
        int maxAttempts,
        double jitter
) {

    public RetryPolicy {
        if (maxAttempts < 1) throw new IllegalArgumentException("maxAttempts >= 1");
        if (jitter < 0 || jitter > 1) throw new IllegalArgumentException("jitter in [0,1]");
    }

    public static RetryPolicy defaults() {
        return new RetryPolicy(BackoffType.EXPONENTIAL, "5s", "5m", 3, 0.2);
    }

    public Duration computeDelay(int attempt) {
        if (attempt < 1) throw new IllegalArgumentException("attempt >= 1");
        var initial = Duration.parse(initialInterval);
        var max = Duration.parse(maxInterval);

        Duration base = switch (type) {
            case CONSTANT -> initial;
            case LINEAR -> initial.multipliedBy(attempt);
            case EXPONENTIAL -> initial.multipliedBy((long) Math.pow(2, attempt - 1));
        };

        if (base.compareTo(max) > 0) base = max;

        if (jitter > 0) {
            var jitterMs = (long) (base.toMillis() * jitter);
            var randomDelta = ThreadLocalRandom.current()
                    .nextLong(-jitterMs, jitterMs + 1);
            base = base.plusMillis(randomDelta);
            if (base.isNegative()) base = Duration.ZERO;
        }

        return base;
    }

    public boolean shouldRetry(int currentAttempt) {
        return currentAttempt < maxAttempts;
    }

    public enum BackoffType {CONSTANT, EXPONENTIAL, LINEAR}

}