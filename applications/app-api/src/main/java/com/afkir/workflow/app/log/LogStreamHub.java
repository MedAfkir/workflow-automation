package com.afkir.workflow.app.log;

import com.afkir.workflow.engine.log.LogEventBroadcaster;
import com.afkir.workflow.domain.execution.ExecutionId;
import com.afkir.workflow.domain.log.LogEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

@Component
public class LogStreamHub implements LogEventBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(LogStreamHub.class);

    private final Sinks.Many<LogEvent> sink =
            Sinks.many().multicast().directBestEffort();

    @Override
    public void publish(LogEvent event) {
        
        var result = sink.tryEmitNext(event);
        if (result.isFailure() && log.isDebugEnabled()) {
            log.debug("LogStreamHub emit failure for log id={} : {}", event.id(), result);
        }
    }

    public Flux<LogEvent> streamFor(ExecutionId executionId) {
        return sink.asFlux()
                .filter(e -> e.executionId().equals(executionId));
    }
}
