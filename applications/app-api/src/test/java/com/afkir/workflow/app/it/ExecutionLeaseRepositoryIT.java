package com.afkir.workflow.app.it;

import com.afkir.workflow.engine.dispatch.ExecutionLeaseRepository;
import com.afkir.workflow.domain.execution.Execution;
import com.afkir.workflow.domain.execution.ExecutionId;
import com.afkir.workflow.domain.execution.ExecutionRepository;
import com.afkir.workflow.domain.namespace.NamespaceKey;
import com.afkir.workflow.domain.workflow.Workflow;
import com.afkir.workflow.domain.workflow.WorkflowDefinition;
import com.afkir.workflow.domain.workflow.WorkflowId;
import com.afkir.workflow.domain.workflow.WorkflowRepository;
import com.afkir.workflow.domain.workflow.WorkflowRevision;
import com.afkir.workflow.domain.task.TaskDefinition;
import com.afkir.workflow.domain.task.TaskId;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.TestPropertySource;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

@TestPropertySource(properties = {
        "workflow.dispatcher.enabled=false",
        "workflow.trigger.enabled=false"
})
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class ExecutionLeaseRepositoryIT extends IntegrationTestBase {

    @Autowired ExecutionLeaseRepository leaseRepository;
    @Autowired ExecutionRepository executionRepository;
    @Autowired WorkflowRepository workflowRepository;
    @Autowired JdbcTemplate jdbc;

    @AfterEach
    void cleanup() {
        truncate(jdbc, "task_run_log", "task_run", "execution",
                       "workflow_revision", "workflow");
    }

    @Test
    void leaseReady_picks_only_CREATED_rows_with_no_active_lease() {
        var revisionId = createWorkflowRevision();
        var pickable = persistFreshExecution(revisionId);
        var alreadyLeased = persistFreshExecution(revisionId);
        markLeased(alreadyLeased, "other-worker", Instant.now().plusSeconds(60));

        var leased = leaseRepository.leaseReady("worker-1", Duration.ofMinutes(1), 10);

        assertThat(leased).extracting(ExecutionId::value)
                .containsExactly(pickable.value())
                .doesNotContain(alreadyLeased.value());
    }

    @Test
    void leaseReady_skips_rows_with_wait_until_in_the_future() {
        var revisionId = createWorkflowRevision();
        var ready = persistFreshExecution(revisionId);
        var sleeping = persistFreshExecution(revisionId);
        setWaitUntil(sleeping, Instant.now().plusSeconds(60));

        var leased = leaseRepository.leaseReady("worker-1", Duration.ofMinutes(1), 10);

        assertThat(leased).extracting(ExecutionId::value)
                .contains(ready.value())
                .doesNotContain(sleeping.value());
    }

    @Test
    void leaseReady_picks_rows_with_wait_until_in_the_past() {
        var revisionId = createWorkflowRevision();
        var resumable = persistFreshExecution(revisionId);
        setWaitUntil(resumable, Instant.now().minusSeconds(1));

        var leased = leaseRepository.leaseReady("worker-1", Duration.ofMinutes(1), 10);

        assertThat(leased).extracting(ExecutionId::value).contains(resumable.value());
    }

    @Test
    void leaseReady_picks_rows_whose_lease_has_expired() {
        var revisionId = createWorkflowRevision();
        var orphan = persistFreshExecution(revisionId);
        markLeased(orphan, "crashed-worker", Instant.now().minusSeconds(10));  

        var leased = leaseRepository.leaseReady("worker-1", Duration.ofMinutes(1), 10);

        assertThat(leased).extracting(ExecutionId::value).contains(orphan.value());
    }

    @Test
    void concurrent_leaseReady_calls_return_disjoint_batches() throws Exception {
        
        var revisionId = createWorkflowRevision();
        int rowCount = 50;
        var ids = IntStream.range(0, rowCount)
                .mapToObj(i -> persistFreshExecution(revisionId))
                .toList();

        int workerCount = 8;
        var collected = new ConcurrentHashMap<UUID, String>();   
        var doublyLeased = new ConcurrentHashMap<UUID, String>();
        var startGate = new CountDownLatch(1);
        var doneGate = new CountDownLatch(workerCount);

        try (var pool = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int w = 0; w < workerCount; w++) {
                String worker = "worker-" + w;
                pool.submit(() -> {
                    try {
                        startGate.await();
                        var batch = leaseRepository.leaseReady(worker, Duration.ofMinutes(1), rowCount);
                        for (var id : batch) {
                            String previous = collected.putIfAbsent(id.value(), worker);
                            if (previous != null) {
                                doublyLeased.put(id.value(), previous + " AND " + worker);
                            }
                        }
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    } finally {
                        doneGate.countDown();
                    }
                });
            }
            startGate.countDown();   
            assertThat(doneGate.await(10, TimeUnit.SECONDS)).isTrue();
        }

        assertThat(doublyLeased)
                .as("FOR UPDATE SKIP LOCKED must guarantee disjoint batches across workers")
                .isEmpty();
        assertThat(collected.keySet())
                .as("All ready rows should be claimed by exactly one worker")
                .hasSize(rowCount);
    }

    @Test
    void renewLease_extends_only_when_called_by_the_holding_worker() {
        var revisionId = createWorkflowRevision();
        var execId = persistFreshExecution(revisionId);
        leaseRepository.leaseReady("alice", Duration.ofMinutes(5), 1);

        boolean aliceRenew = leaseRepository.renewLease(execId, "alice", Duration.ofMinutes(10));
        boolean malloryRenew = leaseRepository.renewLease(execId, "mallory", Duration.ofMinutes(10));

        assertThat(aliceRenew).isTrue();
        assertThat(malloryRenew).isFalse();
    }

    @Test
    void releaseLease_clears_only_when_called_by_the_holding_worker() {
        var revisionId = createWorkflowRevision();
        var execId = persistFreshExecution(revisionId);
        leaseRepository.leaseReady("alice", Duration.ofMinutes(5), 1);

        leaseRepository.releaseLease(execId, "mallory");   
        var leasedByOtherAfter = leaseRepository.leaseReady("bob", Duration.ofMinutes(5), 1);
        assertThat(leasedByOtherAfter).as("Mallory's release should be a no-op").isEmpty();

        leaseRepository.releaseLease(execId, "alice");
        var afterAliceRelease = leaseRepository.leaseReady("bob", Duration.ofMinutes(5), 1);
        assertThat(afterAliceRelease)
                .as("Released lease leaves state=RUNNING; not re-pickable until a state reset")
                .isEmpty();
    }

    @Test
    void recoverOrphanedExecutions_resets_RUNNING_rows_with_expired_leases() {
        var revisionId = createWorkflowRevision();
        var fresh = persistFreshExecution(revisionId);
        var crashed = persistFreshExecution(revisionId);
        var stillAlive = persistFreshExecution(revisionId);

        markLeasedAndRunning(crashed, "dead-worker", Instant.now().minusSeconds(10));
        markLeasedAndRunning(stillAlive, "alive-worker", Instant.now().plusSeconds(60));

        int recovered = leaseRepository.recoverOrphanedExecutions();

        assertThat(recovered).isEqualTo(1);
        
        var leased = leaseRepository.leaseReady("worker-1", Duration.ofMinutes(1), 10);
        assertThat(leased).extracting(ExecutionId::value)
                .contains(fresh.value(), crashed.value())
                .doesNotContain(stillAlive.value());
    }

    private UUID createWorkflowRevision() {
        var workflowId = WorkflowId.generate();
        var revisionId = UUID.randomUUID();
        var ns = "leasetest" + System.nanoTime();
        var key = "wf";
        
        var workflow = new Workflow(workflowId, new NamespaceKey(ns, key),
                revisionId, true, Instant.now(), Instant.now());
        workflowRepository.save(workflow);
        var def = WorkflowDefinition.of(
                new NamespaceKey(ns, key),
                "lease test",
                Map.of(), Map.of(),
                List.of(TaskDefinition.of(new TaskId("noop"), "io.workflowplatform.builtin.Log", Map.of(), null, null)),
                List.of(), List.of()
        );
        var revision = new WorkflowRevision(revisionId, workflowId, 1, "yaml", def, "hash", Instant.now());
        workflowRepository.saveRevision(revision);
        return revisionId;
    }

    private ExecutionId persistFreshExecution(UUID revisionId) {
        var execution = Execution.create(WorkflowId.generate(), revisionId, "MANUAL", null, Map.of());
        executionRepository.save(execution);
        return execution.id();
    }

    private void markLeased(ExecutionId id, String worker, Instant until) {
        jdbc.update("UPDATE execution SET leased_by = ?, leased_until = ? WHERE id = ?",
                worker, java.sql.Timestamp.from(until), id.value());
    }

    private void markLeasedAndRunning(ExecutionId id, String worker, Instant until) {
        jdbc.update("UPDATE execution SET leased_by = ?, leased_until = ?, state = 'RUNNING' WHERE id = ?",
                worker, java.sql.Timestamp.from(until), id.value());
    }

    private void setWaitUntil(ExecutionId id, Instant when) {
        jdbc.update("UPDATE execution SET wait_until = ? WHERE id = ?",
                java.sql.Timestamp.from(when), id.value());
    }
}
