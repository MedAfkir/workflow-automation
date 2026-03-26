package com.afkir.workflow.plugin.builtin.trigger;

import com.afkir.workflow.plugin.meta.Plugin;
import com.afkir.workflow.plugin.meta.PropertyDoc;
import com.afkir.workflow.plugin.trigger.PolledTrigger;
import jakarta.validation.constraints.NotBlank;
import com.afkir.workflow.plugin.trigger.TriggerEvaluation;
import com.afkir.workflow.plugin.trigger.TriggerEvaluationContext;
import com.cronutils.model.CronType;
import com.cronutils.model.definition.CronDefinitionBuilder;
import com.cronutils.model.time.ExecutionTime;
import com.cronutils.parser.CronParser;
import org.springframework.stereotype.Component;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Map;
import java.util.Optional;

@Plugin(
        id = "io.workflowplatform.builtin.Schedule",
        version = "1.0.0",
        description = "Fires the workflow on a cron schedule",
        categories = {"trigger", "schedule"}
)
@Component
public class Schedule implements PolledTrigger<Schedule.Config> {

    private static final CronParser PARSER = new CronParser(
            CronDefinitionBuilder.instanceDefinitionFor(CronType.UNIX)
    );

    public record Config(
            @PropertyDoc(description = "Cron expression (Unix 5-field format)")
            @NotBlank
            String cron,
            @PropertyDoc(description = "Timezone (default UTC)", defaultValue = "UTC")
            String timezone,
            @PropertyDoc(description = "Inputs to pass to the workflow execution")
            Map<String, Object> inputs
    ) {
        public Config {
            if (cron == null || cron.isBlank()) {
                throw new IllegalArgumentException("cron is required");
            }
            if (timezone == null) timezone = "UTC";
            if (inputs == null) inputs = Map.of();
        }
    }

    @Override
    public TriggerEvaluation evaluate(TriggerEvaluationContext<Config> ctx) {
        var config = ctx.config();

        ZoneId zone;
        try {
            zone = ZoneId.of(config.timezone());
        } catch (Exception e) {
            return new TriggerEvaluation.Error("Invalid timezone: " + config.timezone());
        }

        try {
            var cron = PARSER.parse(config.cron());
            var executionTime = ExecutionTime.forCron(cron);
            ZonedDateTime nowZoned = ctx.now().atZone(zone);

            Optional<ZonedDateTime> next = executionTime.nextExecution(nowZoned);
            if (next.isEmpty()) {
                return new TriggerEvaluation.Error("Cron has no future executions");
            }

            ctx.logger().info("Cron firing, next at {}", next.get());
            return new TriggerEvaluation.Fire(config.inputs(), next.get().toInstant());

        } catch (IllegalArgumentException e) {
            return new TriggerEvaluation.Error("Invalid cron expression: " + e.getMessage());
        }
    }
}
