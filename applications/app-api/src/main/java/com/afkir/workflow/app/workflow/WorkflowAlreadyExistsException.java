package com.afkir.workflow.app.workflow;

import com.afkir.workflow.domain.namespace.NamespaceKey;

public class WorkflowAlreadyExistsException extends RuntimeException {
    public WorkflowAlreadyExistsException(NamespaceKey nk) {
        super("Workflow already exists: " + nk.fullName());
    }
}
