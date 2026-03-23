package com.afkir.workflow.domain.workflow;

import java.time.Instant;
import java.util.UUID;

public record WorkflowRevision(
    UUID id,
    WorkflowId workflowId,
    int revision,
    String sourceYaml,
    WorkflowDefinition definition,
    String hash,
    Instant createdAt
) {
}