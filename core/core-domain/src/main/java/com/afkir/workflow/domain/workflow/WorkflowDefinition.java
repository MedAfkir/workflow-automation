package com.afkir.workflow.domain.workflow;

import com.afkir.workflow.domain.namespace.NamespaceKey;
import com.afkir.workflow.domain.task.ErrorHandling;
import com.afkir.workflow.domain.task.TaskDefinition;
import com.afkir.workflow.domain.task.TaskId;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public record WorkflowDefinition(
        NamespaceKey namespaceKey,
        String description,
        Map<String, Object> inputs,
        Map<String, Object> variables,
        List<TaskDefinition> tasks,
        List<TaskDefinition> triggers,
        List<TaskDefinition> errors,
        ErrorHandling errorHandling,
        Concurrency concurrency
) {

    public WorkflowDefinition {
        if (namespaceKey == null) throw new IllegalArgumentException("namespaceKey required");
        tasks = tasks == null ? List.of() : List.copyOf(tasks);
        triggers = triggers == null ? List.of() : List.copyOf(triggers);
        errors = errors == null ? List.of() : List.copyOf(errors);
        inputs = inputs == null ? Map.of() : Map.copyOf(inputs);
        variables = variables == null ? Map.of() : Map.copyOf(variables);
        if (errorHandling == null) errorHandling = ErrorHandling.FAIL_FAST;
        if (concurrency == null) concurrency = Concurrency.UNLIMITED;

        if (tasks.isEmpty()) {
            throw new IllegalArgumentException("Workflow must have at least one task");
        }

        validateUniqueIds(tasks);
        validateDependsOnReferencesExist(tasks);
        validateNoCycles(tasks);
    }

    public static WorkflowDefinition of(NamespaceKey namespaceKey, String description,
                                        Map<String, Object> inputs,
                                        Map<String, Object> variables,
                                        List<TaskDefinition> tasks,
                                        List<TaskDefinition> triggers,
                                        List<TaskDefinition> errors) {
        return new WorkflowDefinition(namespaceKey, description, inputs, variables,
                tasks, triggers, errors, ErrorHandling.FAIL_FAST, Concurrency.UNLIMITED);
    }

    private static void validateUniqueIds(List<TaskDefinition> tasks) {
        var seen = new HashSet<String>(tasks.size());
        for (var t : tasks) {
            if (!seen.add(t.id().value())) {
                throw new IllegalArgumentException("Duplicate task id in workflow: " + t.id().value());
            }
        }
    }

    private static void validateDependsOnReferencesExist(List<TaskDefinition> tasks) {
        var validIds = tasks.stream().map(t -> t.id().value()).collect(java.util.stream.Collectors.toSet());
        for (var t : tasks) {
            if (t.dependsOn() == null) continue;
            for (var dep : t.dependsOn()) {
                if (!validIds.contains(dep.value())) {
                    throw new IllegalArgumentException(
                            "Task '" + t.id().value() + "' depends on unknown task '" +
                                    dep.value() + "'");
                }
            }
        }
    }

    private static void validateNoCycles(List<TaskDefinition> tasks) {
        
        Map<String, List<String>> dependents = new HashMap<>();
        TaskId previous = null;
        for (var t : tasks) {
            for (var dep : t.effectiveDependsOn(previous)) {
                dependents.computeIfAbsent(dep.value(), k -> new ArrayList<>())
                          .add(t.id().value());
            }
            previous = t.id();
        }

        var colour = new HashMap<String, Integer>();
        for (var t : tasks) colour.put(t.id().value(), 0);

        for (var t : tasks) {
            if (colour.get(t.id().value()) == 0) {
                detectCycle(t.id().value(), dependents, colour, new ArrayList<>());
            }
        }
    }

    private static void detectCycle(String node,
                                    Map<String, List<String>> dependents,
                                    Map<String, Integer> colour,
                                    List<String> path) {
        colour.put(node, 1);   
        path.add(node);
        for (var next : dependents.getOrDefault(node, List.of())) {
            int c = colour.get(next);
            if (c == 1) {  
                int cycleStart = path.indexOf(next);
                throw new IllegalArgumentException(
                        "Cycle detected in workflow DAG: " +
                                String.join(" -> ", path.subList(cycleStart, path.size())) +
                                " -> " + next);
            }
            if (c == 0) {
                detectCycle(next, dependents, colour, path);
            }
        }
        colour.put(node, 2);   
        path.remove(path.size() - 1);
    }
}
