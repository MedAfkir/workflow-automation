package com.afkir.workflow.infra.persistence.workflow;

import com.afkir.workflow.domain.namespace.NamespaceKey;
import com.afkir.workflow.domain.workflow.Workflow;
import com.afkir.workflow.domain.workflow.WorkflowDefinition;
import com.afkir.workflow.domain.workflow.WorkflowId;
import com.afkir.workflow.domain.workflow.WorkflowRepository;
import com.afkir.workflow.domain.workflow.WorkflowRevision;
import com.afkir.workflow.domain.workflow.WorkflowListItem;
import com.afkir.workflow.infra.persistence.trigger.TriggerJpaRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Component
public class WorkflowRepositoryAdapter implements WorkflowRepository {

    private final WorkflowJpaRepository workflowJpa;
    private final WorkflowRevisionJpaRepository revisionJpa;
    private final TriggerJpaRepository triggerJpa;
    private final ObjectMapper objectMapper;
    
    private final ObjectMapper jsonbReader;

    public WorkflowRepositoryAdapter(WorkflowJpaRepository workflowJpa,
                                     WorkflowRevisionJpaRepository revisionJpa,
                                     TriggerJpaRepository triggerJpa,
                                     ObjectMapper objectMapper) {
        this.workflowJpa = workflowJpa;
        this.revisionJpa = revisionJpa;
        this.triggerJpa = triggerJpa;
        this.objectMapper = objectMapper;
        this.jsonbReader = objectMapper.rebuild()
                .disable(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES)
                .build();
    }

    @Override
    @Transactional
    public Workflow save(Workflow workflow) {
        var entity = workflowJpa.findById(workflow.id().value())
                .orElseGet(() -> new WorkflowEntity(
                        workflow.id().value(),
                        workflow.namespaceKey().namespace(),
                        workflow.namespaceKey().key()
                ));

        entity.setCurrentRevisionId(workflow.currentRevisionId());
        entity.setEnabled(workflow.enabled());
        entity.setUpdatedAt(java.time.Instant.now());

        var saved = workflowJpa.save(entity);
        return toDomain(saved);
    }

    @Override
    @Transactional
    public WorkflowRevision saveRevision(WorkflowRevision revision) {
        JsonNode parsedJson = objectMapper.valueToTree(revision.definition());
        var entity = new WorkflowRevisionEntity(
                revision.id(),
                revision.workflowId().value(),
                revision.revision(),
                revision.sourceYaml(),
                parsedJson,
                revision.hash()
        );
        var saved = revisionJpa.save(entity);
        return toDomainRevision(saved, revision.definition());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Workflow> findById(WorkflowId id) {
        return workflowJpa.findById(id.value()).map(this::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Workflow> findByNamespaceKey(NamespaceKey nk) {
        return workflowJpa.findByNamespaceAndKey(nk.namespace(), nk.key())
                .map(this::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowListItem> findAllSummaries() {
        var workflows = workflowJpa.findAll(Sort.by(Sort.Direction.DESC, "updatedAt"));
        if (workflows.isEmpty()) {
            return List.of();
        }

        
        
        var revisionIds = workflows.stream()
                .map(WorkflowEntity::getCurrentRevisionId)
                .filter(Objects::nonNull)
                .toList();
        Map<UUID, Integer> revisionNumbers = new HashMap<>();
        for (var r : revisionJpa.findAllById(revisionIds)) {
            revisionNumbers.put(r.getId(), r.getRevision());
        }

        
        Map<UUID, Integer> triggerCounts = new HashMap<>();
        for (Object[] row : triggerJpa.countByWorkflow()) {
            triggerCounts.put((UUID) row[0], ((Long) row[1]).intValue());
        }

        return workflows.stream()
                .map(w -> new WorkflowListItem(
                        new WorkflowId(w.getId()),
                        new NamespaceKey(w.getNamespace(), w.getKey()),
                        w.isEnabled(),
                        revisionNumbers.getOrDefault(w.getCurrentRevisionId(), 0),
                        triggerCounts.getOrDefault(w.getId(), 0),
                        w.getUpdatedAt()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<WorkflowRevision> findRevisionById(UUID revisionId) {
        return revisionJpa.findById(revisionId).map(this::toDomainRevisionFromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowRevision> findRevisions(WorkflowId workflowId) {
        return revisionJpa.findByWorkflowIdOrderByRevisionDesc(workflowId.value())
                .stream().map(this::toDomainRevisionFromEntity).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public int nextRevisionNumber(WorkflowId workflowId) {
        return revisionJpa.findMaxRevisionByWorkflowId(workflowId.value())
                .map(max -> max + 1).orElse(1);
    }

    private Workflow toDomain(WorkflowEntity e) {
        return new Workflow(
                new WorkflowId(e.getId()),
                new NamespaceKey(e.getNamespace(), e.getKey()),
                e.getCurrentRevisionId(),
                e.isEnabled(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }

    private WorkflowRevision toDomainRevision(WorkflowRevisionEntity e, WorkflowDefinition def) {
        return new WorkflowRevision(
                e.getId(),
                new WorkflowId(e.getWorkflowId()),
                e.getRevision(),
                e.getSourceYaml(),
                def,
                e.getHash(),
                e.getCreatedAt()
        );
    }

    private WorkflowRevision toDomainRevisionFromEntity(WorkflowRevisionEntity e) {
        try {
            var def = jsonbReader.treeToValue(e.getParsedJson(), WorkflowDefinition.class);
            return toDomainRevision(e, def);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to deserialize revision " + e.getId(), ex);
        }
    }
}