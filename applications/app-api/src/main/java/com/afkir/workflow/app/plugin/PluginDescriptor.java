package com.afkir.workflow.app.plugin;

import java.util.List;
import java.util.Map;

public record PluginDescriptor(
        String id,
        String version,
        String description,
        PluginKind kind,
        List<String> categories,
        boolean deprecated,
        String replacedBy,
        Map<String, Object> schema) {

    public enum PluginKind {
        
        RUNNABLE,
        
        FLOWABLE,
        
        TRIGGER,
    }
}
