package com.afkir.workflow.domain.workflow;

import com.afkir.workflow.domain.namespace.NamespaceKey;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkflowRepository {

    Workflow save(Workflow workflow);

    WorkflowRevision saveRevision(WorkflowRevision revision);

    Optional<Workflow> findById(WorkflowId id);

    Optional<Workflow> findByNamespaceKey(NamespaceKey namespaceKey);

    List<WorkflowListItem> findAllSummaries();

    Optional<WorkflowRevision> findRevisionById(UUID revisionId);

    List<WorkflowRevision> findRevisions(WorkflowId workflowId);

    int nextRevisionNumber(WorkflowId workflowId);
}
