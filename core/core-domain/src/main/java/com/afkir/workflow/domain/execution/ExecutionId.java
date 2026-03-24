package com.afkir.workflow.domain.execution;

import java.util.UUID;

public record ExecutionId(UUID value) {

    public ExecutionId {
        if (value == null) throw new IllegalArgumentException("ExecutionId required");
    }

    public static ExecutionId generate() {
        return new ExecutionId(UUID.randomUUID());
    }

    public static ExecutionId of(String s) {
        return new ExecutionId(UUID.fromString(s));
    }

    @Override
    public String toString() {
        return value.toString();
    }

}