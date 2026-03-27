package com.afkir.workflow.infra.persistence.execution;

import com.afkir.workflow.domain.execution.ExecutionId;
import com.afkir.workflow.domain.execution.TaskRun;
import com.afkir.workflow.domain.execution.TaskRunRepository;
import com.afkir.workflow.domain.execution.TaskRunState;
import com.afkir.workflow.domain.task.TaskId;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

@Component
public class TaskRunRepositoryAdapter implements TaskRunRepository {

    private final TaskRunJpaRepository jpa;
    private final ObjectMapper mapper;

    public TaskRunRepositoryAdapter(TaskRunJpaRepository jpa, ObjectMapper mapper) {
        this.jpa = jpa;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public TaskRun save(TaskRun taskRun) {
        var entity = jpa.findById(taskRun.id())
                .orElseGet(TaskRunEntity::new);

        entity.setId(taskRun.id());
        entity.setExecutionId(taskRun.executionId().value());
        entity.setTaskId(taskRun.taskId().value());
        entity.setTaskType(taskRun.taskType());
        entity.setParentTaskRunId(taskRun.parentTaskRunId());
        entity.setIteration(taskRun.iteration());
        entity.setSequence(taskRun.sequence());
        entity.setState(taskRun.state().name());
        entity.setAttempt(taskRun.attempt());
        entity.setInputs(mapper.valueToTree(taskRun.inputs()));
        entity.setOutputs(mapper.valueToTree(taskRun.outputs()));
        entity.setErrorMessage(taskRun.errorMessage());
        entity.setErrorCode(taskRun.errorCode());
        entity.setStartedAt(taskRun.startedAt());
        entity.setEndedAt(taskRun.endedAt());
        if (entity.getCreatedAt() == null) entity.setCreatedAt(taskRun.createdAt());

        var saved = jpa.save(entity);
        return toDomain(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskRun> findByExecutionIdOrderBySequence(ExecutionId executionId) {
        return jpa.findByExecutionIdOrderBySequence(executionId.value())
                .stream().map(this::toDomain).toList();
    }

    private TaskRun toDomain(TaskRunEntity e) {
        return new TaskRun(
                e.getId(),
                new ExecutionId(e.getExecutionId()),
                new TaskId(e.getTaskId()),
                e.getTaskType(),
                e.getParentTaskRunId(),
                e.getIteration(),
                e.getSequence(),
                TaskRunState.valueOf(e.getState()),
                e.getAttempt(),
                jsonToMap(e.getInputs()),
                jsonToMap(e.getOutputs()),
                e.getErrorMessage(),
                e.getErrorCode(),
                e.getStartedAt(),
                e.getEndedAt(),
                e.getCreatedAt()
        );
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> jsonToMap(JsonNode node) {
        if (node == null || node.isNull()) return Map.of();
        return mapper.convertValue(node, Map.class);
    }
}
