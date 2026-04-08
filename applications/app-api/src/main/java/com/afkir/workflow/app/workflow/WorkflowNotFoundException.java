package com.afkir.workflow.app.workflow;

import com.afkir.workflow.domain.workflow.WorkflowId;

public class WorkflowNotFoundException extends RuntimeException {
    public WorkflowNotFoundException(WorkflowId id) {
        super("Workflow not found: " + id);
    }
}
