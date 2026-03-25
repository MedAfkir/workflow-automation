package com.afkir.workflow.plugin.runtime;

import java.time.Duration;
import java.util.Map;


public interface RunContext<I> {

    
    I input();

    
    PluginLogger logger();

    
    SecretResolver secrets();

    
    StorageAccess storage();

    
    ExecutionInfo execution();

    
    Duration timeout();

    
    Map<String, Object> previousOutputs();

    
    Map<String, Object> variables();

    
    Map<String, Object> workflowInputs();

    
    boolean isCancelled();
}