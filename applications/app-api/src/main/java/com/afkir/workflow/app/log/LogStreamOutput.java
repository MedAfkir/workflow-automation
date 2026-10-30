package com.afkir.workflow.app.log;

import com.afkir.workflow.domain.log.LogEvent;

import java.io.IOException;

public interface LogStreamOutput {

    boolean isOpen();

    void log(LogEvent event) throws IOException;

    void heartbeat() throws IOException;

    void end() throws IOException;
}
