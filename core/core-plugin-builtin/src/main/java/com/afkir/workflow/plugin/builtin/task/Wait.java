package com.afkir.workflow.plugin.builtin.task;

import com.afkir.workflow.plugin.meta.Plugin;
import com.afkir.workflow.plugin.meta.PropertyDoc;
import com.afkir.workflow.plugin.runtime.RunContext;
import com.afkir.workflow.plugin.task.FlowableResult;
import com.afkir.workflow.plugin.task.FlowableTask;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Plugin(
        id = "io.workflowplatform.builtin.Wait",
        version = "1.0.0",
        description = "Pauses the workflow execution for a duration. Execution is suspended and resumed later.",
        categories = {"orchestration"}
)
@Component
public class Wait implements FlowableTask<Wait.Input> {

    public record Input(
            @PropertyDoc(description = "Duration to wait (ISO-8601, e.g. PT1H, P1D)")
            @NotNull
            Duration duration
    ) {
        public Input {
            if (duration == null || duration.isNegative() || duration.isZero()) {
                throw new IllegalArgumentException("duration must be positive");
            }
            if (duration.toDays() > 30) {
                throw new IllegalArgumentException(
                        "Wait > 30 days not supported. Use Schedule trigger for longer waits.");
            }
        }
    }

    @Override
    public FlowableResult evaluate(RunContext<Input> ctx) {
        ctx.logger().info("Wait: suspending execution for {}", ctx.input().duration());
        return new FlowableResult.WaitFor(ctx.input().duration());
    }

}
