package com.afkir.workflow.domain.trigger;

import com.afkir.workflow.domain.workflow.WorkflowId;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record Trigger(
        UUID id,
        WorkflowId workflowId,
        UUID workflowRevisionId,
        String triggerId,                      
        String type,                            
        Map<String, Object> config,
        boolean enabled,
        Instant nextEvaluationAt,               
        Instant lastEvaluationAt,
        String webhookKey,                      
        String errorMessage,
        Instant createdAt,
        Instant updatedAt
) {
    public Trigger {
        if (id == null || workflowId == null || triggerId == null || type == null) {
            throw new IllegalArgumentException("required fields");
        }
        config = config == null ? Map.of() : Map.copyOf(config);
    }

    public boolean isPushBased() {
        return webhookKey != null;
    }

    public boolean isPolled() {
        return webhookKey == null;
    }

    public Trigger withNextEvaluation(Instant when) {
        return new Trigger(id, workflowId, workflowRevisionId, triggerId, type, config,
                enabled, when, lastEvaluationAt, webhookKey, errorMessage,
                createdAt, Instant.now());
    }

    public Trigger withError(String error) {
        return new Trigger(id, workflowId, workflowRevisionId, triggerId, type, config,
                enabled, nextEvaluationAt, lastEvaluationAt, webhookKey, error,
                createdAt, Instant.now());
    }

    public Trigger evaluated(Instant when) {
        return new Trigger(id, workflowId, workflowRevisionId, triggerId, type, config,
                enabled, nextEvaluationAt, when, webhookKey, null,
                createdAt, Instant.now());
    }

    public Trigger disabled() {
        return new Trigger(id, workflowId, workflowRevisionId, triggerId, type, config,
                false, nextEvaluationAt, lastEvaluationAt, webhookKey, errorMessage,
                createdAt, Instant.now());
    }

}