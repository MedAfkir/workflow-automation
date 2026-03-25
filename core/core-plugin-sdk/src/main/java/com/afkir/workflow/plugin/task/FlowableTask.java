package com.afkir.workflow.plugin.task;

import com.afkir.workflow.plugin.runtime.RunContext;


public interface FlowableTask<I> {

    
    FlowableResult evaluate(RunContext<I> ctx);

}