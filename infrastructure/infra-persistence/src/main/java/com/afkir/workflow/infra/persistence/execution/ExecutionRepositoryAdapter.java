package com.afkir.workflow.infra.persistence.execution;

import com.afkir.workflow.domain.execution.Execution;
import com.afkir.workflow.domain.execution.ExecutionId;
import com.afkir.workflow.domain.execution.ExecutionRepository;
import com.afkir.workflow.domain.execution.ExecutionState;
import com.afkir.workflow.domain.workflow.WorkflowId;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class ExecutionRepositoryAdapter implements ExecutionRepository {

    private final ExecutionJpaRepository jpa;
    private final ObjectMapper mapper;

    public ExecutionRepositoryAdapter(ExecutionJpaRepository jpa, ObjectMapper mapper) {
        this.jpa = jpa;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public Execution save(Execution exec) {
        var entity = jpa.findById(exec.id().value())
                .orElseGet(ExecutionEntity::new);

        entity.setId(exec.id().value());
        entity.setWorkflowId(exec.workflowId().value());
        entity.setWorkflowRevisionId(exec.workflowRevisionId());
        entity.setState(exec.state().name());
        entity.setTriggerType(exec.triggerType());
        entity.setTriggerId(exec.triggerId());
        entity.setInputs(mapper.valueToTree(exec.inputs()));
        entity.setOutputs(mapper.valueToTree(exec.outputs()));
        entity.setErrorMessage(exec.errorMessage());
        entity.setStartedAt(exec.startedAt());
        entity.setEndedAt(exec.endedAt());
        if (entity.getCreatedAt() == null) entity.setCreatedAt(exec.createdAt());
        entity.setWaitUntil(exec.waitUntil());
        
        var saved = jpa.save(entity);
        return toDomain(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Execution> findById(ExecutionId id) {
        return jpa.findById(id.value()).map(this::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Execution> findByWorkflowId(WorkflowId id) {
        return jpa.findByWorkflowIdOrderByCreatedAtDesc(id.value())
                .stream().map(this::toDomain).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Execution> findRecent(int limit, ExecutionState stateFilter) {
        
        var pageable = PageRequest.of(0, Math.max(1, limit));
        var entities = stateFilter == null
                ? jpa.findAllByOrderByCreatedAtDesc(pageable)
                : jpa.findByStateOrderByCreatedAtDesc(stateFilter.name(), pageable);
        return entities.stream().map(this::toDomain).toList();
    }

    private Execution toDomain(ExecutionEntity e) {
        return new Execution(
                new ExecutionId(e.getId()),
                new WorkflowId(e.getWorkflowId()),
                e.getWorkflowRevisionId(),
                ExecutionState.valueOf(e.getState()),
                e.getTriggerType(),
                e.getTriggerId(),
                jsonToMap(e.getInputs()),
                jsonToMap(e.getOutputs()),
                e.getErrorMessage(),
                e.getStartedAt(),
                e.getEndedAt(),
                e.getCreatedAt(),
                e.getWaitUntil()
                
        );
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> jsonToMap(JsonNode node) {
        if (node == null || node.isNull()) return Map.of();
        return mapper.convertValue(node, Map.class);
    }
}
