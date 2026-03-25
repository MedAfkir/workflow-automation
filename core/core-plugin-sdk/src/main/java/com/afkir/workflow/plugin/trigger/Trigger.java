package com.afkir.workflow.plugin.trigger;

import com.afkir.workflow.plugin.runtime.RunContext;


@Deprecated(forRemoval = true)
public interface Trigger<C> {

    
    TriggerEvaluation evaluate(RunContext<C> ctx);

}