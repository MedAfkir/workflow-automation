package com.afkir.workflow.app.log;

import com.afkir.workflow.domain.execution.ExecutionId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/executions")
public class LogStreamController {

    private static final Logger log = LoggerFactory.getLogger(LogStreamController.class);

    private static final Duration MAX_STREAM_DURATION = Duration.ofMinutes(30);

    private final LogTail tail;
    private final AsyncTaskExecutor executor;

    public LogStreamController(LogTail tail,
                               @Qualifier("applicationTaskExecutor") AsyncTaskExecutor executor) {
        this.tail = tail;
        this.executor = executor;
    }

    @GetMapping(value = "/{id}/logs/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            @PathVariable UUID id,
            @RequestHeader(value = "Last-Event-ID", required = false) Long sinceId) {

        var executionId = new ExecutionId(id);
        long since = sinceId == null ? 0L : sinceId;
        var emitter = new SseEmitter(MAX_STREAM_DURATION.toMillis());
        var output = new SseLogStreamOutput(emitter);

        executor.execute(() -> {
            try {
                tail.run(executionId, since, output);
                emitter.complete();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                emitter.complete();
            } catch (IOException e) {
                log.debug("Log stream for execution {} closed by client: {}", id, e.getMessage());
                emitter.completeWithError(e);
            } catch (RuntimeException e) {
                log.warn("Log stream for execution {} failed: {}", id, e.getMessage());
                emitter.completeWithError(e);
            }
        });
        return emitter;
    }
}
