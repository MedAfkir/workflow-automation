package com.afkir.workflow.engine.execution;

import com.afkir.workflow.domain.execution.ExecutionId;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public record ExecutionContext(
        ExecutionId executionId,
        UUID taskRunId,
        String workflowNamespace,
        String workflowKey,
        int workflowRevision,
        Map<String, Object> previousOutputs,
        Map<String, Object> variables,
        Map<String, Object> workflowInputs,
        Map<String, Object> contextOverrides
) {
    public ExecutionContext {
        contextOverrides = contextOverrides == null ? Map.of() : Map.copyOf(contextOverrides);
    }

    public Map<String, Object> templateContext() {
        var ctx = new HashMap<String, Object>();
        ctx.put("inputs", workflowInputs);
        ctx.put("outputs", previousOutputs);
        ctx.put("vars", variables);
        ctx.put("execution", Map.of(
                "id", executionId.value().toString(),
                "namespace", workflowNamespace,
                "key", workflowKey,
                "revision", workflowRevision
        ));
        ctx.putAll(contextOverrides);
        return ctx;
    }
}
