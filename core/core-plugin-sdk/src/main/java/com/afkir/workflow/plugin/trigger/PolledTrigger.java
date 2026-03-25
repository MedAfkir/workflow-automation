package com.afkir.workflow.plugin.trigger;

public interface PolledTrigger<C> {

    TriggerEvaluation evaluate(TriggerEvaluationContext<C> ctx);
}
