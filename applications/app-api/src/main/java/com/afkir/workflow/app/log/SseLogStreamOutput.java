package com.afkir.workflow.app.log;

import com.afkir.workflow.domain.log.LogEvent;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicBoolean;

final class SseLogStreamOutput implements LogStreamOutput {

    private final SseEmitter emitter;
    private final AtomicBoolean open = new AtomicBoolean(true);

    SseLogStreamOutput(SseEmitter emitter) {
        this.emitter = emitter;
        emitter.onCompletion(() -> open.set(false));
        emitter.onTimeout(() -> open.set(false));
        emitter.onError(t -> open.set(false));
    }

    @Override
    public boolean isOpen() {
        return open.get();
    }

    @Override
    public void log(LogEvent event) throws IOException {
        emitter.send(SseEmitter.event()
                .id(String.valueOf(event.id()))
                .name("log")
                .data(LogEventResponse.from(event)));
    }

    @Override
    public void heartbeat() throws IOException {
        emitter.send(SseEmitter.event().comment("ping"));
    }

    @Override
    public void end() throws IOException {
        emitter.send(SseEmitter.event().name("end").data(""));
    }
}
