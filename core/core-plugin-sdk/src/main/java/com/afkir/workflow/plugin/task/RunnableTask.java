package com.afkir.workflow.plugin.task;

import com.afkir.workflow.plugin.error.NonRetryableException;
import com.afkir.workflow.plugin.error.RetryableException;
import com.afkir.workflow.plugin.runtime.RunContext;


public interface RunnableTask<I, O extends TaskOutput> {

    
    O run(RunContext<I> ctx) throws Exception;
}