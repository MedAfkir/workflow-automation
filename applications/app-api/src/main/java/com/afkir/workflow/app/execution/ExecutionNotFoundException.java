package com.afkir.workflow.app.execution;

import com.afkir.workflow.domain.execution.ExecutionId;

public class ExecutionNotFoundException extends RuntimeException {

    public ExecutionNotFoundException(ExecutionId id) {
        super("Execution not found: " + id);
    }
}
