package com.afkir.workflow.engine.log;

import com.afkir.workflow.domain.log.LogEvent;

public interface LogEventBroadcaster {
    
    void publish(LogEvent event);
}
