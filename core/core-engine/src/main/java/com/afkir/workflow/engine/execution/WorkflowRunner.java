package com.afkir.workflow.engine.execution;

import com.afkir.workflow.engine.dispatch.ExecutionLeaseRepository;
import com.afkir.workflow.engine.dispatch.LeaseContext;
import com.afkir.workflow.engine.runtime.CancellationToken;
import com.afkir.workflow.domain.execution.Execution;
import com.afkir.workflow.domain.execution.ExecutionId;
import com.afkir.workflow.domain.execution.ExecutionRepository;
import com.afkir.workflow.domain.execution.ExecutionState;
import com.afkir.workflow.domain.execution.TaskRunRepository;
import com.afkir.workflow.domain.execution.TaskRunState;
import com.afkir.workflow.domain.task.ErrorHandling;
import com.afkir.workflow.domain.workflow.WorkflowRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.Semaphore;
import java.util.concurrent.StructuredTaskScope;
import java.util.concurrent.StructuredTaskScope.Joiner;
import java.util.concurrent.TimeUnit;

@Component
public class WorkflowRunner {

    private static final Logger log = LoggerFactory.getLogger(WorkflowRunner.class);

    private final WorkflowRepository workflowRepository;
    private final ExecutionRepository executionRepository;
    private final TaskRunRepository taskRunRepository;
    private final ExecutionLeaseRepository leaseRepository;
    private final StepExecutor stepExecutor;

    public WorkflowRunner(WorkflowRepository workflowRepository,
                          ExecutionRepository executionRepository,
                          TaskRunRepository taskRunRepository,
                          ExecutionLeaseRepository leaseRepository,
                          StepExecutor stepExecutor) {
        this.workflowRepository = workflowRepository;
        this.executionRepository = executionRepository;
        this.taskRunRepository = taskRunRepository;
        this.leaseRepository = leaseRepository;
        this.stepExecutor = stepExecutor;
    }

    public Execution run(ExecutionId executionId, LeaseContext lease) {
        var execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Execution not found: " + executionId));
        final var revisionId = execution.workflowRevisionId();
        var revision = workflowRepository.findRevisionById(revisionId)
                .orElseThrow(() -> new IllegalStateException(
                        "WorkflowRevision not found: " + revisionId));

        var existingRuns = taskRunRepository.findByExecutionIdOrderBySequence(executionId);

        for (var existing : existingRuns) {
            if (existing.isRoot() && existing.state() == TaskRunState.WAITING) {
                taskRunRepository.save(existing.succeeded(Map.of()));
            }
        }

        var graph = ExecutionGraph.resume(execution, revision, existingRuns);

        log.info("Starting/resuming execution {} (errorHandling={}, concurrency.max={})",
                executionId, graph.errorHandling(),
                revision.definition().concurrency().max());

        var workingExecution = execution.state() == ExecutionState.CREATED
                ? saveExecutionState(execution.started())
                : execution;

        var cancellation = new CancellationToken();
        var leaseRenewer = startLeaseRenewer(executionId, lease, cancellation);

        var concurrencyMax = revision.definition().concurrency().max();
        Semaphore concurrencyLimit = concurrencyMax == null ? null : new Semaphore(concurrencyMax);

        try {
            return loop(graph, workingExecution, cancellation, concurrencyLimit);
        } finally {
            leaseRenewer.shutdown();
            try {
                leaseRepository.releaseLease(executionId, lease.workerId());
            } catch (Exception e) {
                log.warn("Failed to release lease for {}: {}", executionId, e.getMessage());
            }
        }
    }

    private Execution loop(ExecutionGraph graph,
                           Execution workingExecution,
                           CancellationToken cancellation,
                           Semaphore concurrencyLimit) {
        
        Instant suspendUntil = null;

        while (!graph.isComplete() && !cancellation.isCancelled()) {

            while (graph.hasPendingChildren() && !cancellation.isCancelled()) {
                var child = graph.nextChild().orElseThrow();
                var childResult = stepExecutor.execute(child, graph, workingExecution, cancellation);
                var childAction = handleChildResult(child, childResult, graph);
                if (childAction.terminal != null) {
                    return saveExecutionState(childAction.terminal);
                }
                if (childAction.suspendUntil != null) {
                    suspendUntil = laterOf(suspendUntil, childAction.suspendUntil);
                }
            }
            if (cancellation.isCancelled()) break;

            if (suspendUntil != null) break;

            var ready = graph.nextReady();
            if (ready.isEmpty() && graph.inFlight().isEmpty()) {
                
                break;
            }

            var batchSuspend = dispatchBatch(ready, graph, workingExecution, cancellation, concurrencyLimit);
            if (batchSuspend.terminal != null) {
                return saveExecutionState(batchSuspend.terminal);
            }
            if (batchSuspend.suspendUntil != null) {
                suspendUntil = laterOf(suspendUntil, batchSuspend.suspendUntil);
            }
        }

        if (cancellation.isCancelled()) {
            log.info("Execution {} cancelled (lease lost or kill requested)",
                    graph.executionId());
            return saveExecutionState(workingExecution.killRequested());
        }
        if (suspendUntil != null) {
            log.info("Execution {} suspending until {}", graph.executionId(), suspendUntil);
            return saveExecutionState(workingExecution.suspended(suspendUntil));
        }
        if (graph.hasFailures()) {
            log.warn("Execution {} completed with failures", graph.executionId());
            return saveExecutionState(workingExecution.failed("One or more tasks failed"));
        }
        log.info("Execution {} completed successfully", graph.executionId());
        return saveExecutionState(workingExecution.succeeded(graph.finalOutputs()));
    }

    private LoopAction dispatchBatch(Set<ScheduledStep> ready,
                                      ExecutionGraph graph,
                                      Execution workingExecution,
                                      CancellationToken cancellation,
                                      Semaphore concurrencyLimit) {
        Joiner<StepResult, ?> joiner = graph.errorHandling() == ErrorHandling.FAIL_FAST
                ? Joiner.<StepResult>awaitAllSuccessfulOrThrow()
                : Joiner.<StepResult>awaitAll();
        try (var scope = StructuredTaskScope.open(joiner,
                cfg -> cfg.withName("workflow-batch")
                          .withThreadFactory(Thread.ofVirtual().factory()))) {
            return forkAwaitProcess(scope, ready, graph, workingExecution,
                    cancellation, concurrencyLimit);
        }
    }

    private LoopAction forkAwaitProcess(StructuredTaskScope<? super StepResult, ?> scope,
                                         Set<ScheduledStep> ready,
                                         ExecutionGraph graph,
                                         Execution workingExecution,
                                         CancellationToken cancellation,
                                         Semaphore concurrencyLimit) {
        
        var forks = new LinkedHashMap<ScheduledStep, StructuredTaskScope.Subtask<? extends StepResult>>();
        for (var step : ready) {
            graph.markInFlight(step.taskDef().id());
            StructuredTaskScope.Subtask<? extends StepResult> subtask = scope.fork(() -> {
                if (concurrencyLimit != null) concurrencyLimit.acquire();
                try {
                    return stepExecutor.execute(step, graph, workingExecution, cancellation);
                } finally {
                    if (concurrencyLimit != null) concurrencyLimit.release();
                }
            });
            forks.put(step, subtask);
        }

        try {
            scope.join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            cancellation.cancel();
            return LoopAction.terminal(workingExecution.killRequested());
        } catch (StructuredTaskScope.FailedException e) {
            
        }

        return processForks(forks, graph, workingExecution, cancellation);
    }

    private LoopAction processForks(Map<ScheduledStep, StructuredTaskScope.Subtask<? extends StepResult>> forks,
                                     ExecutionGraph graph,
                                     Execution workingExecution,
                                     CancellationToken cancellation) {
        Instant batchSuspend = null;
        String failureMessage = null;

        for (var entry : forks.entrySet()) {
            var step = entry.getKey();
            var subtask = entry.getValue();
            var taskId = step.taskDef().id();

            if (subtask.state() == StructuredTaskScope.Subtask.State.SUCCESS) {
                StepResult result = subtask.get();
                switch (result) {
                    case StepResult.Continue c -> graph.recordCompletion(taskId, c.outputs());
                    case StepResult.Spawn s -> {
                        
                        graph.recordCompletion(taskId, Map.of("spawned", s.children().size()));
                        graph.enqueueAllChildrenFirst(s.children());
                    }
                    case StepResult.Wait w -> {
                        graph.recordCompletion(taskId, Map.of("waiting", true));
                        batchSuspend = laterOf(batchSuspend, w.until());
                    }
                    case StepResult.Fail f -> {
                        graph.recordFailure(taskId);
                        if (!step.taskDef().allowFailure() && failureMessage == null) {
                            failureMessage = "Task " + taskId.value() + " failed: " + f.message();
                        }
                    }
                    case StepResult.Cancel ignored -> {
                        graph.recordFailure(taskId);
                        cancellation.cancel();
                    }
                }
            } else if (subtask.state() == StructuredTaskScope.Subtask.State.FAILED) {
                graph.recordFailure(taskId);
                if (!step.taskDef().allowFailure() && failureMessage == null) {
                    var ex = subtask.exception();
                    failureMessage = "Task " + taskId.value() + " threw: " + ex.getMessage();
                }
            }
            
        }

        if (failureMessage != null && graph.errorHandling() == ErrorHandling.FAIL_FAST) {
            return LoopAction.terminal(workingExecution.failed(failureMessage));
        }
        return batchSuspend == null ? LoopAction.continueLoop() : LoopAction.suspend(batchSuspend);
    }

    private LoopAction handleChildResult(ScheduledStep child, StepResult result, ExecutionGraph graph) {
        return switch (result) {
            case StepResult.Continue ignored -> LoopAction.continueLoop();
            case StepResult.Spawn s -> {
                graph.enqueueAllChildrenFirst(s.children());
                yield LoopAction.continueLoop();
            }
            case StepResult.Wait w -> LoopAction.suspend(w.until());
            case StepResult.Fail f -> {
                String msg = "Child task " + child.taskDef().id().value() +
                        " failed: " + f.message();
                yield LoopAction.terminal(
                        executionRepository.findById(graph.executionId()).orElseThrow().failed(msg));
            }
            case StepResult.Cancel ignored -> LoopAction.terminal(
                    executionRepository.findById(graph.executionId()).orElseThrow().killRequested());
        };
    }

    private static Instant laterOf(Instant a, Instant b) {
        if (a == null) return b;
        if (b == null) return a;
        return a.isAfter(b) ? a : b;
    }

    private ScheduledExecutorService startLeaseRenewer(ExecutionId executionId,
                                                      LeaseContext lease,
                                                      CancellationToken cancellation) {
        var scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            var t = new Thread(r, "lease-renewer-" + executionId.value());
            t.setDaemon(true);
            return t;
        });
        long periodSeconds = Math.max(10, lease.ttl().toSeconds() / 3);
        scheduler.scheduleAtFixedRate(
                () -> {
                    try {
                        boolean renewed = leaseRepository.renewLease(
                                executionId, lease.workerId(), lease.ttl());
                        if (!renewed) {
                            log.warn("Lease lost for {} - another worker stole it. " +
                                    "Cancelling current run.", executionId);
                            cancellation.cancel();
                        } else {
                            log.debug("Lease renewed for {} (next in {}s)", executionId, periodSeconds);
                        }
                    } catch (Exception e) {
                        log.error("Lease renewal failed for {}: {}", executionId, e.getMessage());
                    }
                },
                periodSeconds, periodSeconds, TimeUnit.SECONDS);
        return scheduler;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    protected Execution saveExecutionState(Execution exec) {
        return executionRepository.save(exec);
    }

    private record LoopAction(Execution terminal, Instant suspendUntil) {
        static LoopAction continueLoop() { return new LoopAction(null, null); }
        static LoopAction terminal(Execution exec) { return new LoopAction(exec, null); }
        static LoopAction suspend(Instant until) { return new LoopAction(null, until); }
    }
}
