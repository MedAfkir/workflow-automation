package com.afkir.workflow.domain.workflow;

import java.util.UUID;

public record WorkflowId(UUID value) {

    public WorkflowId {
        if (value == null) throw new IllegalArgumentException("WorkflowId cannot be null");
    }

    public static WorkflowId generate() {
        return new WorkflowId(UUID.randomUUID());
    }

    public static WorkflowId of(String s) {
        return new WorkflowId(UUID.fromString(s));
    }

    @Override
    public String toString() {
        return value.toString();
    }

}