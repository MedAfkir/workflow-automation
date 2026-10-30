package com.afkir.workflow.app.log;

import com.afkir.workflow.domain.execution.ExecutionId;
import com.afkir.workflow.domain.execution.ExecutionRepository;
import com.afkir.workflow.domain.log.LogEvent;
import com.afkir.workflow.infra.persistence.log.LogQueryService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Component
public class LogTail {

    private final LogQueryService logQueryService;
    private final ExecutionRepository executionRepository;
    private final Duration pollInterval;
    private final Duration heartbeatInterval;

    public LogTail(LogQueryService logQueryService,
                   ExecutionRepository executionRepository,
                   @Value("${workflow.logs.stream-poll-interval:PT0.5S}") Duration pollInterval,
                   @Value("${workflow.logs.stream-heartbeat-interval:PT15S}") Duration heartbeatInterval) {
        this.logQueryService = logQueryService;
        this.executionRepository = executionRepository;
        this.pollInterval = pollInterval;
        this.heartbeatInterval = heartbeatInterval;
    }

    public void run(ExecutionId executionId, long sinceId, LogStreamOutput output)
            throws IOException, InterruptedException {
        long cursor = sinceId;
        boolean terminalSeen = false;
        Instant lastWrite = Instant.now();

        while (output.isOpen()) {
            List<LogEvent> page = logQueryService.findSince(executionId, cursor);
            for (LogEvent event : page) {
                output.log(event);
                cursor = event.id();
            }

            if (!page.isEmpty()) {
                lastWrite = Instant.now();
                terminalSeen = false;
                if (page.size() == LogQueryService.PAGE_SIZE) continue;
            } else if (terminalSeen) {
                output.end();
                return;
            } else {
                terminalSeen = isTerminal(executionId);
            }

            if (Duration.between(lastWrite, Instant.now()).compareTo(heartbeatInterval) >= 0) {
                output.heartbeat();
                lastWrite = Instant.now();
            }
            Thread.sleep(pollInterval);
        }
    }

    private boolean isTerminal(ExecutionId executionId) {
        return executionRepository.findById(executionId)
                .map(e -> e.state().isTerminal())
                .orElse(true);
    }
}
