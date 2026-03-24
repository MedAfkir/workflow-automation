package com.afkir.workflow.domain.execution;

public enum ExecutionState {
    CREATED,
    RUNNING,
    SUCCESS,
    FAILED,
    KILLED;

    public boolean isTerminal() {
        return this == SUCCESS || this == FAILED || this == KILLED;
    }

}