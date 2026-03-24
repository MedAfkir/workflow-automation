package com.afkir.workflow.domain.execution;

import com.afkir.workflow.domain.task.TaskId;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record TaskRun(
        UUID id,
        ExecutionId executionId,
        TaskId taskId,
        String taskType,
        UUID parentTaskRunId,
        Integer iteration,
        int sequence,
        TaskRunState state,
        int attempt,
        Map<String, Object> inputs,
        Map<String, Object> outputs,
        String errorMessage,
        String errorCode,
        Instant startedAt,
        Instant endedAt,
        Instant createdAt
) {

    public TaskRun {
        if (id == null || executionId == null || taskId == null) {
            throw new IllegalArgumentException("ids required");
        }
        if (state == null) state = TaskRunState.PENDING;
        if (attempt < 1) throw new IllegalArgumentException("attempt >= 1");
        inputs = inputs == null ? Map.of() : Map.copyOf(inputs);
        outputs = outputs == null ? Map.of() : Map.copyOf(outputs);
    }

    public boolean isRoot() {
        return parentTaskRunId == null;
    }

    public static TaskRun create(ExecutionId execId, TaskId taskId, String taskType,
                                 int sequence, Map<String, Object> inputs) {
        return createAttempt(execId, taskId, taskType, sequence, 1, inputs);
    }

    public static TaskRun createAttempt(ExecutionId execId, TaskId taskId, String taskType,
                                        int sequence, int attempt,
                                        Map<String, Object> inputs) {
        return new TaskRun(
                UUID.randomUUID(), execId, taskId, taskType,
                null, null,
                sequence, TaskRunState.PENDING, attempt,
                inputs, null, null, null,
                null, null, Instant.now()
        );
    }

    public static TaskRun createChild(ExecutionId execId, TaskId taskId, String taskType,
                                      UUID parentTaskRunId, Integer iteration,
                                      int sequence, Map<String, Object> inputs) {
        return new TaskRun(
                UUID.randomUUID(), execId, taskId, taskType,
                parentTaskRunId, iteration,
                sequence, TaskRunState.PENDING, 1,
                inputs, null, null, null,
                null, null, Instant.now()
        );
    }

    public TaskRun started() {
        return new TaskRun(id, executionId, taskId, taskType,
                parentTaskRunId, iteration,
                sequence, TaskRunState.RUNNING, attempt,
                inputs, outputs, errorMessage, errorCode,
                Instant.now(), endedAt, createdAt);
    }

    public TaskRun succeeded(Map<String, Object> outs) {
        return new TaskRun(id, executionId, taskId, taskType,
                parentTaskRunId, iteration,
                sequence, TaskRunState.SUCCESS, attempt,
                inputs, outs, null, null,
                startedAt, Instant.now(), createdAt);
    }

    public TaskRun failed(String errorCode, String errorMessage) {
        return new TaskRun(id, executionId, taskId, taskType,
                parentTaskRunId, iteration,
                sequence, TaskRunState.FAILED, attempt,
                inputs, outputs, errorMessage, errorCode,
                startedAt, Instant.now(), createdAt);
    }

    public TaskRun waiting() {
        return new TaskRun(id, executionId, taskId, taskType,
                parentTaskRunId, iteration,
                sequence, TaskRunState.WAITING, attempt,
                inputs, outputs, null, null,
                startedAt, Instant.now(), createdAt);
    }

}
