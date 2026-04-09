package com.afkir.workflow.app.log;

import com.afkir.workflow.infra.persistence.log.LogQueryService;
import com.afkir.workflow.domain.execution.ExecutionId;
import com.afkir.workflow.domain.log.LogEvent;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.Duration;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/executions")
public class LogStreamController {

    private static final Duration MAX_STREAM_DURATION = Duration.ofMinutes(30);

    private static final Duration HEARTBEAT_INTERVAL = Duration.ofSeconds(15);

    private final LogQueryService logQueryService;
    private final LogStreamHub hub;

    public LogStreamController(LogQueryService logQueryService, LogStreamHub hub) {
        this.logQueryService = logQueryService;
        this.hub = hub;
    }

    @GetMapping(value = "/{id}/logs/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<LogEventResponse>> stream(
            @PathVariable UUID id,
            @RequestHeader(value = "Last-Event-ID", required = false) Long sinceId) {

        var executionId = new ExecutionId(id);
        long since = sinceId == null ? 0L : sinceId;

        Flux<LogEvent> backlog = Mono
                .fromCallable(() -> logQueryService.findSince(executionId, since))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMapMany(Flux::fromIterable);

        Flux<LogEvent> live = hub.streamFor(executionId);

        Flux<ServerSentEvent<LogEventResponse>> events = backlog.concatWith(live)
                .map(LogEventResponse::from)
                .map(e -> ServerSentEvent.<LogEventResponse>builder()
                        .id(String.valueOf(e.id()))
                        .event("log")
                        .data(e)
                        .build());

        Flux<ServerSentEvent<LogEventResponse>> heartbeat = Flux.interval(HEARTBEAT_INTERVAL)
                .map(t -> ServerSentEvent.<LogEventResponse>builder().comment("ping").build());

        return Flux.merge(events, heartbeat)
                .take(MAX_STREAM_DURATION);
    }
}
