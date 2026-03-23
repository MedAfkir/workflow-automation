package com.afkir.workflow.domain.workflow;

import com.afkir.workflow.domain.namespace.NamespaceKey;

import java.time.Instant;
import java.util.UUID;

public record Workflow(
    WorkflowId id,
    NamespaceKey namespaceKey,
    UUID currentRevisionId,
    boolean enabled,
    Instant createdAt,
    Instant updatedAt
) {}