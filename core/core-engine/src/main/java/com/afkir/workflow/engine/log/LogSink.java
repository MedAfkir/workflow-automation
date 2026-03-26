package com.afkir.workflow.engine.log;

import com.afkir.workflow.domain.log.LogEvent;

public interface LogSink {
    void append(LogEvent event);
}
