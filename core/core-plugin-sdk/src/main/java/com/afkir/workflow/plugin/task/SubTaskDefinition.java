package com.afkir.workflow.plugin.task;

import java.util.Map;


public record SubTaskDefinition(
    String taskId,                  
    String type,                    
    Map<String, Object> config,     
    Map<String, Object> contextOverrides  
) {
    public SubTaskDefinition {
        if (taskId == null || type == null) {
            throw new IllegalArgumentException("taskId and type are required");
        }
        config = config == null ? Map.of() : Map.copyOf(config);
        contextOverrides = contextOverrides == null ? Map.of() : Map.copyOf(contextOverrides);
    }
}