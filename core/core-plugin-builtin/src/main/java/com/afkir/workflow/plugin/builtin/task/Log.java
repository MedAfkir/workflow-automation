package com.afkir.workflow.plugin.builtin.task;

import com.afkir.workflow.plugin.runtime.RunContext;
import com.afkir.workflow.plugin.task.RunnableTask;
import com.afkir.workflow.plugin.task.TaskOutput;
import com.afkir.workflow.plugin.meta.Plugin;
import com.afkir.workflow.plugin.meta.PropertyDoc;
import jakarta.validation.constraints.NotBlank;
import org.springframework.stereotype.Component;

@Plugin(
        id = "io.workflowplatform.builtin.Log",
        version = "1.0.0",
        description = "Logs a message at the configured level"
)
@Component
public class Log implements RunnableTask<Log.Input, Log.Output> {

    public record Input(
            @PropertyDoc(description = "Message to log")
            @NotBlank
            String message,
            @PropertyDoc(description = "Log level (TRACE, DEBUG, INFO, WARN, ERROR)", defaultValue = "INFO")
            Level level
    ) {
        public Input {
            if (message == null || message.isBlank()) {
                throw new IllegalArgumentException("message is required");
            }
            if (level == null) level = Level.INFO;
        }
    }

    public record Output(String logged) implements TaskOutput {
    }

    public enum Level {TRACE, DEBUG, INFO, WARN, ERROR}

    @Override
    public Output run(RunContext<Input> ctx) {
        var msg = ctx.input().message();
        var logger = ctx.logger();
        switch (ctx.input().level()) {
            case TRACE -> logger.trace(msg);
            case DEBUG -> logger.debug(msg);
            case INFO -> logger.info(msg);
            case WARN -> logger.warn(msg);
            case ERROR -> logger.error(msg);
        }
        return new Output(msg);
    }
}
