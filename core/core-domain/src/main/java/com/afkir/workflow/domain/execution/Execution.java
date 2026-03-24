package com.afkir.workflow.domain.execution;

import com.afkir.workflow.domain.workflow.WorkflowId;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record Execution(
        ExecutionId id,
        WorkflowId workflowId,
        UUID workflowRevisionId,
        ExecutionState state,
        String triggerType,
        UUID triggerId,
        Map<String, Object> inputs,
        Map<String, Object> outputs,
        String errorMessage,
        Instant startedAt,
        Instant endedAt,
        Instant createdAt,
        Instant waitUntil
) {
    public Execution {
        if (id == null || workflowId == null || workflowRevisionId == null) {
            throw new IllegalArgumentException("ids required");
        }
        if (state == null) state = ExecutionState.CREATED;
        if (triggerType == null) triggerType = "MANUAL";
        inputs = inputs == null ? Map.of() : Map.copyOf(inputs);
        outputs = outputs == null ? Map.of() : Map.copyOf(outputs);
    }

    public static Execution create(WorkflowId workflowId, UUID revisionId,
                                   String triggerType, UUID triggerId,
                                   Map<String, Object> inputs) {
        return new Execution(
                ExecutionId.generate(), workflowId, revisionId,
                ExecutionState.CREATED, triggerType, triggerId,
                inputs, null, null, null, null, Instant.now(),
                null
        );
    }

    public Execution withState(ExecutionState newState) {
        return new Execution(id, workflowId, workflowRevisionId, newState,
                triggerType, triggerId, inputs, outputs, errorMessage,
                startedAt, endedAt, createdAt, waitUntil);
    }

    public Execution started() {
        return new Execution(id, workflowId, workflowRevisionId, ExecutionState.RUNNING,
                triggerType, triggerId, inputs, outputs, errorMessage,
                Instant.now(), endedAt, createdAt, waitUntil);
    }

    public Execution succeeded(Map<String, Object> finalOutputs) {
        
        return new Execution(id, workflowId, workflowRevisionId, ExecutionState.SUCCESS,
                triggerType, triggerId, inputs, finalOutputs, null,
                startedAt, Instant.now(), createdAt, null);
    }

    public Execution failed(String errorMessage) {
        return new Execution(id, workflowId, workflowRevisionId, ExecutionState.FAILED,
                triggerType, triggerId, inputs, outputs, errorMessage,
                startedAt, Instant.now(), createdAt, null);
    }

    public Execution suspended(Instant waitUntil) {
        return new Execution(id, workflowId, workflowRevisionId, ExecutionState.CREATED,
                triggerType, triggerId, inputs, outputs, errorMessage,
                startedAt, null, createdAt, waitUntil);
    }

    public Execution killRequested() {
        return new Execution(id, workflowId, workflowRevisionId, ExecutionState.KILLED,
                triggerType, triggerId, inputs, outputs, "Killed by user request",
                startedAt, Instant.now(), createdAt, null);
    }
}
