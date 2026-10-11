package com.afkir.workflow.engine.execution;

import com.afkir.workflow.engine.plugin.PluginRegistry;
import com.afkir.workflow.engine.runtime.CancellationToken;
import com.afkir.workflow.domain.execution.Execution;
import com.afkir.workflow.domain.execution.TaskRun;
import com.afkir.workflow.domain.execution.TaskRunRepository;
import com.afkir.workflow.domain.task.RetryPolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.Semaphore;
import java.util.concurrent.StructuredTaskScope;
import java.util.concurrent.StructuredTaskScope.Joiner;

@Component
public class StepExecutor {

    private static final Logger log = LoggerFactory.getLogger(StepExecutor.class);
    private static final long CANCEL_CHECK_MILLIS = 500L;

    private final TaskExecutor taskExecutor;
    private final FlowableExecutor flowableExecutor;
    private final PluginRegistry registry;
    private final TaskRunRepository taskRunRepository;

    public StepExecutor(TaskExecutor taskExecutor,
                        FlowableExecutor flowableExecutor,
                        PluginRegistry registry,
                        TaskRunRepository taskRunRepository) {
        this.taskExecutor = taskExecutor;
        this.flowableExecutor = flowableExecutor;
        this.registry = registry;
        this.taskRunRepository = taskRunRepository;
    }

    public StepResult execute(ScheduledStep step,
                              ExecutionGraph graph,
                              Execution execution,
                              CancellationToken cancellation) {
        var plugin = registry.require(step.taskDef().type());

        int sequence = graph.nextSequence();
        var taskRun = step.isRoot()
                ? TaskRun.create(execution.id(), step.taskDef().id(), step.taskDef().type(),
                                 sequence, Map.of())
                : TaskRun.createChild(execution.id(), step.taskDef().id(), step.taskDef().type(),
                                      step.parentTaskRunId(), step.iteration(), sequence, Map.of());
        taskRun = taskRunRepository.save(taskRun.started());

        return switch (plugin.kind()) {
            case RUNNABLE -> runRunnable(step, graph, execution, taskRun, cancellation);
            case FLOWABLE -> runFlowable(step, graph, execution, taskRun, cancellation);
        };
    }

    private StepResult runRunnable(ScheduledStep step,
                                   ExecutionGraph graph,
                                   Execution execution,
                                   TaskRun firstAttempt,
                                   CancellationToken cancellation) {
        var policy = step.taskDef().retryPolicy();
        int maxAttempts = policy != null ? policy.maxAttempts() : 1;
        var taskRun = firstAttempt;

        while (true) {
            int attempt = taskRun.attempt();
            var ctx = graph.buildContext(execution, taskRun.id(), step.contextOverrides());
            var outcome = taskExecutor.execute(step.taskDef(), ctx, cancellation);

            if (outcome instanceof TaskExecutionOutcome.Success success) {
                taskRunRepository.save(
                        taskRun.withInputs(success.resolvedInputs()).succeeded(success.outputs()));
                if (attempt > 1) {
                    log.info("Task {} succeeded on attempt {}/{}",
                            step.taskDef().id().value(), attempt, maxAttempts);
                } else {
                    log.info("Task {} succeeded", step.taskDef().id().value());
                }
                return new StepResult.Continue(success.outputs());
            }

            var failure = (TaskExecutionOutcome.Failure) outcome;
            
            taskRunRepository.save(
                    taskRun.withInputs(failure.resolvedInputs())
                            .failed(failure.errorCode(), failure.errorMessage()));
            log.warn("Task {} attempt {}/{} failed [{}]: {}",
                    step.taskDef().id().value(), attempt, maxAttempts,
                    failure.errorCode(), failure.errorMessage());

            boolean canRetry = failure.retryable()
                    && policy != null
                    && attempt < maxAttempts;
            if (!canRetry) {
                return new StepResult.Fail(failure.errorCode(), failure.errorMessage());
            }

            var delay = policy.computeDelay(attempt);
            log.info("Task {} will retry in {} (next attempt {}/{})",
                    step.taskDef().id().value(), delay, attempt + 1, maxAttempts);
            if (!sleepCancellable(delay, cancellation)) {
                log.info("Task {} cancelled during retry delay", step.taskDef().id().value());
                return new StepResult.Cancel();
            }

            int nextSequence = graph.nextSequence();
            
            var nextRun = step.isRoot()
                    ? TaskRun.createAttempt(execution.id(), step.taskDef().id(),
                                            step.taskDef().type(), nextSequence,
                                            attempt + 1, Map.of())
                    : TaskRun.createChild(execution.id(), step.taskDef().id(),
                                          step.taskDef().type(),
                                          step.parentTaskRunId(), step.iteration(),
                                          nextSequence, Map.of());
            taskRun = taskRunRepository.save(nextRun.started());
        }
    }

    private StepResult runFlowable(ScheduledStep step,
                                   ExecutionGraph graph,
                                   Execution execution,
                                   TaskRun taskRun,
                                   CancellationToken cancellation) {
        var result = flowableExecutor.execute(step, graph, execution, taskRun.id());

        if (result instanceof StepResult.Spawn spawn
                && spawn.concurrency() != null && spawn.concurrency() > 1
                && !spawn.children().isEmpty()) {
            return runChildrenInParallel(spawn, taskRun, graph, execution, cancellation);
        }

        switch (result) {
            case StepResult.Continue c ->
                    taskRunRepository.save(taskRun.succeeded(c.outputs() == null ? Map.of() : c.outputs()));
            case StepResult.Spawn s ->
                    
                    taskRunRepository.save(taskRun.succeeded(Map.of("spawned", s.children().size())));
            case StepResult.Wait ignored ->
                    
                    taskRunRepository.save(taskRun.waiting());
            case StepResult.Fail f ->
                    taskRunRepository.save(taskRun.failed(f.code(), f.message()));
            case StepResult.Cancel ignored ->
                    taskRunRepository.save(taskRun.failed("CANCELLED", "Execution killed"));
        }
        return result;
    }

    private StepResult runChildrenInParallel(StepResult.Spawn spawn,
                                             TaskRun parentRun,
                                             ExecutionGraph graph,
                                             Execution execution,
                                             CancellationToken cancellation) {
        int concurrency = spawn.concurrency();
        var semaphore = new Semaphore(concurrency);
        var aggregated = new LinkedHashMap<String, Object>();
        String failureCode = null;
        String failureMessage = null;

        record ChildFork(ScheduledStep step,
                         StructuredTaskScope.Subtask<StepResult> subtask) {}

        try (var scope = StructuredTaskScope.open(
                Joiner.<StepResult>awaitAll(),
                cfg -> cfg.withName("flowable-children-" + parentRun.taskId().value())
                          .withThreadFactory(Thread.ofVirtual().factory()))) {

            var forks = new java.util.ArrayList<ChildFork>(spawn.children().size());
            for (var child : spawn.children()) {
                StructuredTaskScope.Subtask<StepResult> subtask = scope.fork(() -> {
                    semaphore.acquire();
                    try {
                        return execute(child, graph, execution, cancellation);
                    } finally {
                        semaphore.release();
                    }
                });
                forks.add(new ChildFork(child, subtask));
            }

            try {
                scope.join();
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                taskRunRepository.save(parentRun.failed(
                        "INTERRUPTED",
                        "Interrupted while awaiting parallel children"));
                return new StepResult.Cancel();
            }

            for (var fork : forks) {
                var childId = fork.step().taskDef().id().value();
                switch (fork.subtask().state()) {
                    case SUCCESS -> {
                        switch (fork.subtask().get()) {
                            case StepResult.Continue cont ->
                                    aggregated.put(childId, cont.outputs() == null ? Map.of() : cont.outputs());
                            case StepResult.Fail fail -> {
                                if (!fork.step().taskDef().allowFailure() && failureCode == null) {
                                    failureCode = fail.code();
                                    failureMessage = "Child " + childId + " failed: " + fail.message();
                                }
                            }
                            case StepResult.Spawn ignored ->
                                    
                                    aggregated.put(childId, Map.of());
                            case StepResult.Wait ignored -> {
                                if (failureCode == null) {
                                    failureCode = "WAIT_IN_PARALLEL_CHILD";
                                    failureMessage = "Child " + childId
                                            + " requested Wait inside a parallel parent (unsupported)";
                                }
                            }
                            case StepResult.Cancel ignored -> {
                                if (failureCode == null) {
                                    failureCode = "CANCELLED";
                                    failureMessage = "Child " + childId + " was cancelled";
                                }
                            }
                        }
                    }
                    case FAILED -> {
                        if (!fork.step().taskDef().allowFailure() && failureCode == null) {
                            var ex = fork.subtask().exception();
                            failureCode = "CHILD_THREW";
                            failureMessage = "Child " + childId + " threw: "
                                    + ex.getClass().getSimpleName() + ": " + ex.getMessage();
                        }
                    }
                    case UNAVAILABLE -> {
                        
                    }
                }
            }
        }

        if (failureCode != null) {
            log.warn("Flowable {} parallel children failed: {}",
                    parentRun.taskId().value(), failureMessage);
            taskRunRepository.save(parentRun.failed(failureCode, failureMessage));
            return new StepResult.Fail(failureCode, failureMessage);
        }

        log.info("Flowable {} parallel children completed ({} children, concurrency={})",
                parentRun.taskId().value(), spawn.children().size(), concurrency);
        taskRunRepository.save(parentRun.succeeded(aggregated));
        return new StepResult.Continue(aggregated);
    }

    private boolean sleepCancellable(Duration delay, CancellationToken cancellation) {
        long endMillis = System.currentTimeMillis() + delay.toMillis();
        while (System.currentTimeMillis() < endMillis) {
            if (cancellation.isCancelled()) return false;
            long remaining = endMillis - System.currentTimeMillis();
            if (remaining <= 0) break;
            try {
                Thread.sleep(Math.min(CANCEL_CHECK_MILLIS, remaining));
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        return true;
    }
}
