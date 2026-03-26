package com.afkir.workflow.engine.runtime;

import com.afkir.workflow.engine.log.LogSink;
import com.afkir.workflow.plugin.runtime.PluginLogger;
import com.afkir.workflow.domain.execution.ExecutionId;
import com.afkir.workflow.domain.log.LogEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.helpers.MessageFormatter;

import java.util.UUID;

public class EngineLogger implements PluginLogger {

    private static final Logger log = LoggerFactory.getLogger("workflow.task");

    private final ExecutionId executionId;        
    private final UUID taskRunId;                  
    private final String prefix;
    private final LogSink sink;                    

    private EngineLogger(ExecutionId executionId, UUID taskRunId,
                         String label, LogSink sink) {
        this.executionId = executionId;
        this.taskRunId = taskRunId;
        this.prefix = "[" + label + "] ";
        this.sink = sink;
    }

    public static EngineLogger forExecution(ExecutionId executionId, UUID taskRunId,
                                            String taskIdLabel, LogSink sink) {
        var label = executionId.value() + "][" + taskIdLabel;
        return new EngineLogger(executionId, taskRunId, label, sink);
    }

    public static EngineLogger forTrigger(String triggerLabel) {
        return new EngineLogger(null, null, "trigger:" + triggerLabel, null);
    }

    @Override
    public void trace(String m) { emit("TRACE", m); log.trace(prefix + m); }
    @Override
    public void debug(String m) { emit("DEBUG", m); log.debug(prefix + m); }
    @Override
    public void info(String m)  { emit("INFO",  m); log.info(prefix + m); }
    @Override
    public void warn(String m)  { emit("WARN",  m); log.warn(prefix + m); }
    @Override
    public void error(String m) { emit("ERROR", m); log.error(prefix + m); }

    @Override
    public void error(String m, Throwable t) {
        
        emit("ERROR", m + " - " + t.getClass().getSimpleName() + ": " + t.getMessage());
        log.error(prefix + m, t);
    }

    @Override
    public void info(String f, Object... a)  { String m = format(f, a); emit("INFO",  m); log.info(prefix + m); }
    @Override
    public void warn(String f, Object... a)  { String m = format(f, a); emit("WARN",  m); log.warn(prefix + m); }
    @Override
    public void error(String f, Object... a) { String m = format(f, a); emit("ERROR", m); log.error(prefix + m); }

    private void emit(String level, String message) {
        if (sink == null || executionId == null) return;
        
        try {
            sink.append(LogEvent.submit(executionId, taskRunId, level, message));
        } catch (Throwable t) {
            log.warn("LogSink.append failed (event dropped): {}", t.getMessage());
        }
    }

    private String format(String f, Object... a) {
        return MessageFormatter.arrayFormat(f, a).getMessage();
    }
}
