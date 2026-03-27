package com.afkir.workflow.infra.persistence.execution;

import com.afkir.workflow.engine.dispatch.ExecutionLeaseRepository;
import com.afkir.workflow.domain.execution.ExecutionId;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
public class ExecutionLeaseRepositoryAdapter implements ExecutionLeaseRepository {

    private static final Logger log = LoggerFactory.getLogger(ExecutionLeaseRepositoryAdapter.class);

    @PersistenceContext
    private EntityManager em;

    @Override
    @Transactional
    public List<ExecutionId> leaseReady(String workerId, Duration leaseTtl, int limit) {
        
        @SuppressWarnings("unchecked")
        List<Object> raw = em.createNativeQuery("""
                UPDATE execution
                SET leased_by = :worker,
                    leased_until = :until,
                    state = 'RUNNING',
                    started_at = COALESCE(started_at, now())
                WHERE id IN (
                    SELECT id FROM execution
                    WHERE state = 'CREATED'
                      AND (wait_until IS NULL OR wait_until <= now())
                      AND (leased_by IS NULL OR leased_until < now())
                    ORDER BY created_at
                    FOR UPDATE SKIP LOCKED
                    LIMIT :batch_limit
                )
                RETURNING id
                """)
                .setParameter("worker", workerId)
                .setParameter("until", Instant.now().plus(leaseTtl))
                .setParameter("batch_limit", limit)
                .getResultList();

        if (raw.isEmpty()) return List.of();

        var ids = raw.stream()
                .map(o -> (UUID) o)
                .map(ExecutionId::new)
                .toList();

        log.debug("Worker {} leased {} executions", workerId, ids.size());
        return ids;
    }

    @Override
    @Transactional
    public boolean renewLease(ExecutionId id, String workerId, Duration newTtl) {
        int rows = em.createNativeQuery("""
                UPDATE execution
                SET leased_until = :until
                WHERE id = :id AND leased_by = :worker
                """)
                .setParameter("id", id.value())
                .setParameter("worker", workerId)
                .setParameter("until", Instant.now().plus(newTtl))
                .executeUpdate();
        return rows == 1;  
    }

    @Override
    @Transactional
    public void releaseLease(ExecutionId id, String workerId) {
        em.createNativeQuery("""
                UPDATE execution
                SET leased_by = NULL, leased_until = NULL
                WHERE id = :id AND leased_by = :worker
                """)
                .setParameter("id", id.value())
                .setParameter("worker", workerId)
                .executeUpdate();
    }

    @Override
    @Transactional
    public int recoverOrphanedExecutions() {
        
        return em.createNativeQuery("""
                UPDATE execution
                SET state = 'CREATED', leased_by = NULL, leased_until = NULL
                WHERE state = 'RUNNING'
                  AND leased_until IS NOT NULL
                  AND leased_until < now()
                """)
                .executeUpdate();
    }
}
