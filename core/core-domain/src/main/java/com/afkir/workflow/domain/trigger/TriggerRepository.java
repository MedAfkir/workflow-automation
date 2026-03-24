package com.afkir.workflow.domain.trigger;

import com.afkir.workflow.domain.workflow.WorkflowId;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TriggerRepository {
    Trigger save(Trigger trigger);

    Optional<Trigger> findById(UUID id);

    Optional<Trigger> findByWebhookKey(String key);

    List<Trigger> findReadyToEvaluate(Instant now, int limit);

    List<Trigger> findByWorkflowId(WorkflowId workflowId);

    void deleteByWorkflowId(WorkflowId workflowId);
}