package com.afkir.workflow.plugin.builtin.task;

import com.afkir.workflow.plugin.meta.Plugin;
import com.afkir.workflow.plugin.meta.PropertyDoc;
import com.afkir.workflow.plugin.runtime.RunContext;
import com.afkir.workflow.plugin.task.RunnableTask;
import com.afkir.workflow.plugin.task.TaskOutput;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Plugin(
    id = "io.workflowplatform.builtin.Sleep",
    version = "1.0.0",
    description = "Pauses execution for the configured duration"
)
@Component
public class Sleep implements RunnableTask<Sleep.Input, Sleep.Output> {

    public record Input(
        @PropertyDoc(description = "Duration in ISO-8601 format (e.g. PT5S, PT2M)")
        @NotNull
        Duration duration
    ) {
        public Input {
            if (duration == null || duration.isNegative() || duration.isZero()) {
                throw new IllegalArgumentException("duration must be positive");
            }
            if (duration.toMinutes() > 60) {
                throw new IllegalArgumentException("duration cannot exceed 60 minutes (use a Wait task for longer waits)");
            }
        }
    }

    public record Output(long sleptMs) implements TaskOutput {}

    @Override
    public Output run(RunContext<Input> ctx) throws InterruptedException {
        var ms = ctx.input().duration().toMillis();
        ctx.logger().info("Sleeping for {} ms", ms);

        long elapsed = 0;
        long step = 100;
        while (elapsed < ms) {
            if (ctx.isCancelled()) {
                ctx.logger().warn("Sleep cancelled after {} ms", elapsed);
                break;
            }
            Thread.sleep(Math.min(step, ms - elapsed));
            elapsed += step;
        }
        return new Output(elapsed);
    }

}
