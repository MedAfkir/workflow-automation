package com.afkir.workflow.plugin.trigger;

import com.afkir.workflow.plugin.runtime.PluginLogger;
import com.afkir.workflow.plugin.runtime.SecretResolver;

import java.time.Instant;

public interface TriggerEvaluationContext<C> {

    C config();

    PluginLogger logger();

    SecretResolver secrets();

    Instant now();

    Instant lastEvaluation();

    String workflowNamespace();

    String workflowKey();
}
