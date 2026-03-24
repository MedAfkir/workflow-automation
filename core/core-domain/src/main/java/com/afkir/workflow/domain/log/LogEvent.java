package com.afkir.workflow.domain.log;

import com.afkir.workflow.domain.execution.ExecutionId;

import java.time.Instant;
import java.util.UUID;

public record LogEvent(
        long id,
        ExecutionId executionId,
        UUID taskRunId,
        String level,
        String message,
        Instant loggedAt
) {
    public LogEvent {
        if (executionId == null) {
            throw new IllegalArgumentException("executionId required");
        }
        if (level == null || level.isBlank()) {
            throw new IllegalArgumentException("level required");
        }
        if (message == null) {
            throw new IllegalArgumentException("message required (use empty string for no message)");
        }
        if (loggedAt == null) {
            throw new IllegalArgumentException("loggedAt required");
        }
    }

    public static LogEvent submit(ExecutionId executionId, UUID taskRunId,
                                  String level, String message) {
        return new LogEvent(0L, executionId, taskRunId, level, message, Instant.now());
    }

    public LogEvent withId(long persistedId) {
        return new LogEvent(persistedId, executionId, taskRunId, level, message, loggedAt);
    }

    public boolean isPersisted() {
        return id > 0L;
    }
}
