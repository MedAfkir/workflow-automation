package com.afkir.workflow.infra.persistence.workflow;

import com.afkir.workflow.domain.namespace.NamespaceKey;
import com.afkir.workflow.domain.workflow.Workflow;
import com.afkir.workflow.domain.workflow.WorkflowId;
import com.afkir.workflow.domain.workflow.WorkflowRevision;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Deprecated(forRemoval = true)
public interface WorkflowRepository {
    Workflow save(Workflow workflow);

    WorkflowRevision saveRevision(WorkflowRevision revision);

    Optional<Workflow> findById(WorkflowId id);

    Optional<Workflow> findByNamespaceKey(NamespaceKey nk);

    Optional<WorkflowRevision> findRevisionById(UUID revisionId);

    List<WorkflowRevision> findRevisions(WorkflowId workflowId);

    int nextRevisionNumber(WorkflowId workflowId);
}
