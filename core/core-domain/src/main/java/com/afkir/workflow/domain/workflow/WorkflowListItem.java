package com.afkir.workflow.domain.workflow;

import com.afkir.workflow.domain.namespace.NamespaceKey;

import java.time.Instant;

public record WorkflowListItem(
        WorkflowId id,
        NamespaceKey namespaceKey,
        boolean enabled,
        int currentRevision,
        int triggerCount,
        Instant updatedAt
) {}
