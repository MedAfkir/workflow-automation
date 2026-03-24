package com.afkir.workflow.domain.execution;

public enum TaskRunState {
    PENDING,
    RUNNING,
    SUCCESS,
    FAILED,
    SKIPPED,
    WAITING;

    public boolean isTerminal() {
        return this == SUCCESS || this == FAILED || this == SKIPPED;
    }

}