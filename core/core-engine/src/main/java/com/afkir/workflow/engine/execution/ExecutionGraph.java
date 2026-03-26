package com.afkir.workflow.engine.execution;

import com.afkir.workflow.domain.execution.Execution;
import com.afkir.workflow.domain.execution.ExecutionId;
import com.afkir.workflow.domain.execution.TaskRun;
import com.afkir.workflow.domain.execution.TaskRunState;
import com.afkir.workflow.domain.task.ErrorHandling;
import com.afkir.workflow.domain.task.TaskDefinition;
import com.afkir.workflow.domain.task.TaskId;
import com.afkir.workflow.domain.workflow.WorkflowRevision;
import com.google.common.graph.GraphBuilder;
import com.google.common.graph.MutableGraph;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

public final class ExecutionGraph {

    private final ExecutionId executionId;
    private final WorkflowRevision revision;
    private final ErrorHandling errorHandling;

    private final MutableGraph<TaskId> graph;
    private final Map<TaskId, TaskDefinition> definitions;

    private final Set<TaskId> completed = new HashSet<>();
    
    private final Set<TaskId> inFlight = new HashSet<>();
    
    private final Set<TaskId> failed = new HashSet<>();
    
    private final Set<TaskId> skipped = new HashSet<>();

    private final Map<String, Object> outputs = new LinkedHashMap<>();

    private final Deque<ScheduledStep> pendingChildren = new ArrayDeque<>();

    private final AtomicInteger sequenceCounter;

    private ExecutionGraph(ExecutionId executionId, WorkflowRevision revision, int initialSequence) {
        this.executionId = executionId;
        this.revision = revision;
        this.errorHandling = revision.definition().errorHandling();
        this.sequenceCounter = new AtomicInteger(initialSequence);
        this.graph = GraphBuilder.directed().allowsSelfLoops(false).build();
        this.definitions = new HashMap<>();
    }

    public static ExecutionGraph resume(Execution execution,
                                        WorkflowRevision revision,
                                        List<TaskRun> existingRuns) {
        int maxSequence = existingRuns.stream()
                .mapToInt(TaskRun::sequence)
                .max()
                .orElse(0);
        var graph = new ExecutionGraph(execution.id(), revision, maxSequence);
        graph.buildStaticGraph();

        for (var run : existingRuns) {
            if (!run.isRoot()) continue;
            if (run.state() == TaskRunState.SUCCESS) {
                graph.completed.add(run.taskId());
                graph.outputs.put(run.taskId().value(), run.outputs());
            } else if (run.state() == TaskRunState.WAITING) {
                graph.completed.add(run.taskId());
                
            }
        }
        return graph;
    }

    private void buildStaticGraph() {
        var tasks = revision.definition().tasks();
        TaskId previous = null;
        for (var task : tasks) {
            graph.addNode(task.id());
            definitions.put(task.id(), task);
            for (var dep : task.effectiveDependsOn(previous)) {
                graph.putEdge(dep, task.id());
            }
            previous = task.id();
        }
    }

    public ExecutionId executionId() {
        return executionId;
    }

    public WorkflowRevision revision() {
        return revision;
    }

    public ErrorHandling errorHandling() {
        return errorHandling;
    }

    public int nextSequence() {
        return sequenceCounter.incrementAndGet();
    }

    public Map<String, Object> currentOutputs() {
        return Map.copyOf(outputs);
    }

    public Map<String, Object> finalOutputs() {
        return Map.copyOf(outputs);
    }

    public Set<TaskId> inFlight() {
        return Set.copyOf(inFlight);
    }

    public boolean isComplete() {
        int settled = completed.size() + failed.size() + skipped.size();
        return settled == graph.nodes().size();
    }

    public boolean isFullySucceeded() {
        return failed.isEmpty() && skipped.isEmpty()
                && completed.size() == graph.nodes().size();
    }

    public boolean hasFailures() {
        return !failed.isEmpty();
    }

    public Set<ScheduledStep> nextReady() {
        var ready = new java.util.LinkedHashSet<ScheduledStep>();
        for (var nodeId : graph.nodes()) {
            if (completed.contains(nodeId)) continue;
            if (inFlight.contains(nodeId)) continue;
            if (failed.contains(nodeId)) continue;
            if (skipped.contains(nodeId)) continue;
            if (!completed.containsAll(graph.predecessors(nodeId))) continue;
            ready.add(ScheduledStep.root(definitions.get(nodeId)));
        }
        return ready;
    }

    public void markInFlight(TaskId id) {
        inFlight.add(id);
    }

    public void recordCompletion(TaskId id, Map<String, Object> output) {
        inFlight.remove(id);
        completed.add(id);
        outputs.put(id.value(), output == null ? Map.of() : Map.copyOf(output));
    }

    public Set<TaskId> recordFailure(TaskId id) {
        inFlight.remove(id);
        failed.add(id);
        var cascadeSkipped = new java.util.LinkedHashSet<TaskId>();
        cascadeSkippedRecursive(id, cascadeSkipped);
        skipped.addAll(cascadeSkipped);
        return cascadeSkipped;
    }

    private void cascadeSkippedRecursive(TaskId failedId, Set<TaskId> acc) {
        for (var dependent : graph.successors(failedId)) {
            if (acc.add(dependent)) cascadeSkippedRecursive(dependent, acc);
        }
    }

    public void enqueueChildFirst(ScheduledStep step) {
        pendingChildren.addFirst(step);
    }

    public void enqueueAllChildrenFirst(List<ScheduledStep> steps) {
        for (int i = steps.size() - 1; i >= 0; i--) {
            pendingChildren.addFirst(steps.get(i));
        }
    }

    public Optional<ScheduledStep> nextChild() {
        return Optional.ofNullable(pendingChildren.poll());
    }

    public boolean hasPendingChildren() {
        return !pendingChildren.isEmpty();
    }

    public ExecutionContext buildContext(Execution execution, UUID taskRunId,
                                         Map<String, Object> contextOverrides) {
        return new ExecutionContext(
                executionId,
                taskRunId,
                revision.definition().namespaceKey().namespace(),
                revision.definition().namespaceKey().key(),
                revision.revision(),
                Map.copyOf(outputs),
                Map.of(),
                execution.inputs(),
                contextOverrides == null ? Map.of() : Map.copyOf(contextOverrides)
        );
    }
}
