package com.afkir.workflow.app.execution;

import com.afkir.workflow.app.execution.dto.ExecutionDetailResponse;
import com.afkir.workflow.app.execution.dto.ExecutionResponse;
import com.afkir.workflow.app.execution.dto.ExecutionSummaryResponse;
import com.afkir.workflow.app.execution.dto.TaskRunResponse;
import com.afkir.workflow.domain.execution.Execution;
import com.afkir.workflow.domain.execution.TaskRun;
import com.afkir.workflow.domain.task.TaskDefinition;
import com.afkir.workflow.domain.task.TaskId;
import com.afkir.workflow.domain.workflow.Workflow;
import com.afkir.workflow.domain.workflow.WorkflowDefinition;
import com.afkir.workflow.domain.workflow.WorkflowRevision;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class ExecutionMapper {

    private ExecutionMapper() {
    }

    public static ExecutionDetailResponse toDetail(
            Execution exec,
            List<TaskRun> taskRuns,
            Workflow workflow,
            WorkflowRevision revision) {
        var execResponse = toResponse(exec, workflow, revision);
        var ctx = TaskDefinitionLookup.from(revision.definition());
        var taskRunResponses = taskRuns.stream()
                .map(r -> toResponse(r, ctx))
                .toList();
        return new ExecutionDetailResponse(execResponse, taskRunResponses);
    }

    public static ExecutionResponse toResponse(
            Execution e, Workflow workflow, WorkflowRevision revision) {
        return new ExecutionResponse(
                e.id().value(),
                e.workflowId().value(),
                e.workflowRevisionId(),
                workflow.namespaceKey().key(),
                workflow.namespaceKey().namespace(),
                revision.revision(),
                e.state().name(),
                e.triggerType(),
                e.triggerId(),
                e.inputs(),
                e.outputs(),
                e.errorMessage(),
                e.startedAt(),
                e.endedAt(),
                e.createdAt());
    }

    public static ExecutionSummaryResponse toSummary(
            Execution e, Workflow workflow, WorkflowRevision revision) {
        return new ExecutionSummaryResponse(
                e.id().value(),
                e.workflowId().value(),
                workflow.namespaceKey().key(),
                workflow.namespaceKey().namespace(),
                revision.revision(),
                e.state().name(),
                e.triggerType(),
                e.triggerId(),
                e.errorMessage(),
                e.startedAt(),
                e.endedAt(),
                e.createdAt());
    }

    public static TaskRunResponse toResponse(TaskRun r, TaskDefinitionLookup ctx) {
        var def = ctx.byTaskId.get(r.taskId().value());
        int maxAttempts = def != null && def.retryPolicy() != null
                ? def.retryPolicy().maxAttempts()
                : 1;

        List<String> dependsOn;
        boolean explicit;
        if (def == null) {
            
            dependsOn = List.of();
            explicit = false;
        } else if (def.hasImplicitDependency()) {
            explicit = false;
            var prev = ctx.previousByTaskId.get(r.taskId().value());
            dependsOn = prev == null ? List.of() : List.of(prev);
        } else {
            explicit = true;
            dependsOn = def.dependsOn().stream().map(TaskId::value).toList();
        }

        return new TaskRunResponse(
                r.id(),
                r.taskId().value(),
                r.taskType(),
                r.sequence(),
                r.state().name(),
                r.attempt(),
                maxAttempts,
                r.parentTaskRunId(),
                r.iteration(),
                dependsOn,
                explicit,
                r.inputs(),
                r.outputs(),
                r.errorMessage(),
                r.errorCode(),
                r.startedAt(),
                r.endedAt());
    }

    public record TaskDefinitionLookup(
            Map<String, TaskDefinition> byTaskId,
            Map<String, String> previousByTaskId) {

        public static TaskDefinitionLookup from(WorkflowDefinition definition) {
            var byTaskId = new HashMap<String, TaskDefinition>(definition.tasks().size());
            var previousByTaskId = new HashMap<String, String>(definition.tasks().size());
            TaskId previous = null;
            for (var t : definition.tasks()) {
                byTaskId.put(t.id().value(), t);
                if (previous != null) {
                    previousByTaskId.put(t.id().value(), previous.value());
                }
                previous = t.id();
            }
            return new TaskDefinitionLookup(byTaskId, previousByTaskId);
        }
    }
}
