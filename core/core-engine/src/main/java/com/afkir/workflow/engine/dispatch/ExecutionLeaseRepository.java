package com.afkir.workflow.engine.dispatch;

import com.afkir.workflow.domain.execution.ExecutionId;

import java.time.Duration;
import java.util.List;

public interface ExecutionLeaseRepository {

    List<ExecutionId> leaseReady(String workerId, Duration leaseTtl, int limit);

    boolean renewLease(ExecutionId id, String workerId, Duration newTtl);

    void releaseLease(ExecutionId id, String workerId);

    int recoverOrphanedExecutions();
}
