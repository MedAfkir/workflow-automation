package com.afkir.workflow.app.log;

import com.afkir.workflow.domain.log.LogEvent;

import java.time.Instant;
import java.util.UUID;

public record LogEventResponse(
        long id,
        UUID executionId,
        UUID taskRunId,
        String level,
        String message,
        Instant loggedAt
) {
    public static LogEventResponse from(LogEvent e) {
        return new LogEventResponse(
                e.id(),
                e.executionId().value(),
                e.taskRunId(),
                e.level(),
                e.message(),
                e.loggedAt()
        );
    }
}
