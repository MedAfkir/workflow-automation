package com.afkir.workflow.infra.persistence.trigger;

import com.afkir.workflow.domain.trigger.Trigger;
import com.afkir.workflow.domain.trigger.TriggerRepository;
import com.afkir.workflow.domain.workflow.WorkflowId;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Component
public class TriggerRepositoryAdapter implements TriggerRepository {

    private final TriggerJpaRepository jpa;
    private final ObjectMapper mapper;

    public TriggerRepositoryAdapter(TriggerJpaRepository jpa, ObjectMapper mapper) {
        this.jpa = jpa;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public Trigger save(Trigger trigger) {
        var entity = jpa.findById(trigger.id())
                .orElseGet(TriggerEntity::new);

        entity.setId(trigger.id());
        entity.setWorkflowId(trigger.workflowId().value());
        entity.setWorkflowRevisionId(trigger.workflowRevisionId());
        entity.setTriggerId(trigger.triggerId());
        entity.setType(trigger.type());
        entity.setConfig(mapper.valueToTree(trigger.config()));
        entity.setEnabled(trigger.enabled());
        entity.setNextEvaluationAt(trigger.nextEvaluationAt());
        entity.setLastEvaluationAt(trigger.lastEvaluationAt());
        entity.setWebhookKey(trigger.webhookKey());
        entity.setErrorMessage(trigger.errorMessage());
        if (entity.getCreatedAt() == null) entity.setCreatedAt(trigger.createdAt());
        entity.setUpdatedAt(trigger.updatedAt() != null ? trigger.updatedAt() : Instant.now());

        var saved = jpa.save(entity);
        return toDomain(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Trigger> findById(UUID id) {
        return jpa.findById(id).map(this::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Trigger> findByWebhookKey(String key) {
        return jpa.findByWebhookKey(key).map(this::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Trigger> findReadyToEvaluate(Instant now, int limit) {
        return jpa.findReadyToEvaluate(now, PageRequest.of(0, limit))
                .stream().map(this::toDomain).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Trigger> findByWorkflowId(WorkflowId workflowId) {
        return jpa.findByWorkflowId(workflowId.value())
                .stream().map(this::toDomain).toList();
    }

    @Override
    @Transactional
    public void deleteByWorkflowId(WorkflowId workflowId) {
        jpa.deleteByWorkflowId(workflowId.value());
    }

    private Trigger toDomain(TriggerEntity e) {
        return new Trigger(
                e.getId(),
                new WorkflowId(e.getWorkflowId()),
                e.getWorkflowRevisionId(),
                e.getTriggerId(),
                e.getType(),
                jsonToMap(e.getConfig()),
                e.isEnabled(),
                e.getNextEvaluationAt(),
                e.getLastEvaluationAt(),
                e.getWebhookKey(),
                e.getErrorMessage(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> jsonToMap(JsonNode node) {
        if (node == null || node.isNull()) return Map.of();
        return mapper.convertValue(node, Map.class);
    }
}
