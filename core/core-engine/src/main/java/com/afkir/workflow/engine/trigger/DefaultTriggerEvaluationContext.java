package com.afkir.workflow.engine.trigger;

import com.afkir.workflow.plugin.runtime.PluginLogger;
import com.afkir.workflow.plugin.runtime.SecretResolver;
import com.afkir.workflow.plugin.trigger.TriggerEvaluationContext;

import java.time.Instant;

public record DefaultTriggerEvaluationContext<C>(
        C config,
        PluginLogger logger,
        SecretResolver secrets,
        Instant now,
        Instant lastEvaluation,
        String workflowNamespace,
        String workflowKey
) implements TriggerEvaluationContext<C> {
}
