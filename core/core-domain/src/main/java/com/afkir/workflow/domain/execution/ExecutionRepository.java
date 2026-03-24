package com.afkir.workflow.domain.execution;

import com.afkir.workflow.domain.workflow.WorkflowId;

import java.util.List;
import java.util.Optional;

public interface ExecutionRepository {

    Execution save(Execution execution);

    Optional<Execution> findById(ExecutionId id);

    List<Execution> findByWorkflowId(WorkflowId workflowId);

    
    List<Execution> findRecent(int limit, ExecutionState stateFilter);
}