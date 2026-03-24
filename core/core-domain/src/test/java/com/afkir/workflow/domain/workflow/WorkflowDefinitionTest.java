package com.afkir.workflow.domain.workflow;

import com.afkir.workflow.domain.namespace.NamespaceKey;
import com.afkir.workflow.domain.task.ErrorHandling;
import com.afkir.workflow.domain.task.TaskDefinition;
import com.afkir.workflow.domain.task.TaskId;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class WorkflowDefinitionTest {

    private static final NamespaceKey NS = new NamespaceKey("acme", "sample");

    @Test
    void rejects_workflow_without_tasks() {
        assertThatThrownBy(() -> WorkflowDefinition.of(NS, "desc", null, null,
                                                       List.of(), null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("at least one task");
    }

    @Test
    void rejects_duplicate_task_ids() {
        var t1 = TaskDefinition.of(new TaskId("t1"), "Log", Map.of(), null, null);
        var t2 = TaskDefinition.of(new TaskId("t1"), "Log", Map.of(), null, null);

        assertThatThrownBy(() -> WorkflowDefinition.of(NS, null, null, null,
                                                       List.of(t1, t2), null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Duplicate task id");
    }

    @Test
    void rejects_dependsOn_referencing_unknown_task() {
        var a = TaskDefinition.of(new TaskId("a"), "Log", Map.of(), null, null);
        var b = withDependencies(new TaskId("b"), List.of(new TaskId("nonexistent")));

        assertThatThrownBy(() -> WorkflowDefinition.of(NS, null, null, null,
                                                       List.of(a, b), null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("unknown task")
                .hasMessageContaining("nonexistent");
    }

    @Test
    void rejects_workflow_with_a_simple_cycle() {
        
        var a = withDependencies(new TaskId("a"), List.of(new TaskId("b")));
        var b = withDependencies(new TaskId("b"), List.of(new TaskId("a")));

        assertThatThrownBy(() -> WorkflowDefinition.of(NS, null, null, null,
                                                       List.of(a, b), null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cycle detected");
    }

    @Test
    void rejects_workflow_with_a_3_node_cycle() {
        var a = withDependencies(new TaskId("a"), List.of(new TaskId("c")));
        var b = withDependencies(new TaskId("b"), List.of(new TaskId("a")));
        var c = withDependencies(new TaskId("c"), List.of(new TaskId("b")));

        assertThatThrownBy(() -> WorkflowDefinition.of(NS, null, null, null,
                                                       List.of(a, b, c), null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cycle detected");
    }

    @Test
    void rejects_self_loop() {
        var a = withDependencies(new TaskId("a"), List.of(new TaskId("a")));

        assertThatThrownBy(() -> WorkflowDefinition.of(NS, null, null, null,
                                                       List.of(a), null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cycle detected");
    }

    @Test
    void accepts_a_valid_DAG_with_diamond_shape() {
        
        var a = withDependencies(new TaskId("a"), List.of());
        var b = withDependencies(new TaskId("b"), List.of(new TaskId("a")));
        var c = withDependencies(new TaskId("c"), List.of(new TaskId("a")));
        var d = withDependencies(new TaskId("d"), List.of(new TaskId("b"), new TaskId("c")));

        var def = WorkflowDefinition.of(NS, null, null, null,
                                        List.of(a, b, c, d), null, null);
        assertThat(def.tasks()).hasSize(4);
    }

    @Test
    void accepts_implicit_chain_when_dependsOn_is_omitted() {
        
        var t1 = TaskDefinition.of(new TaskId("t1"), "Log", Map.of(), null, null);
        var t2 = TaskDefinition.of(new TaskId("t2"), "Log", Map.of(), null, null);
        var t3 = TaskDefinition.of(new TaskId("t3"), "Log", Map.of(), null, null);

        var def = WorkflowDefinition.of(NS, null, null, null,
                                        List.of(t1, t2, t3), null, null);
        assertThat(def.tasks()).hasSize(3);
        assertThat(t2.hasImplicitDependency()).isTrue();
        assertThat(t2.effectiveDependsOn(t1.id())).containsExactly(t1.id());
    }

    @Test
    void empty_dependsOn_opts_out_of_implicit_chain() {
        var t1 = TaskDefinition.of(new TaskId("t1"), "Log", Map.of(), null, null);
        var t2 = withDependencies(new TaskId("t2"), List.of());   

        var def = WorkflowDefinition.of(NS, null, null, null,
                                        List.of(t1, t2), null, null);
        assertThat(def.tasks()).hasSize(2);
        assertThat(t2.hasImplicitDependency()).isFalse();
        assertThat(t2.effectiveDependsOn(t1.id())).isEmpty();
    }

    @Test
    void defaults_errorHandling_to_FAIL_FAST_when_omitted() {
        var t = TaskDefinition.of(new TaskId("t1"), "Log", Map.of(), null, null);
        var def = WorkflowDefinition.of(NS, null, null, null, List.of(t), null, null);
        assertThat(def.errorHandling()).isEqualTo(ErrorHandling.FAIL_FAST);
        assertThat(def.concurrency()).isEqualTo(Concurrency.UNLIMITED);
    }

    private static TaskDefinition withDependencies(TaskId id, List<TaskId> deps) {
        return new TaskDefinition(id, "io.workflowplatform.builtin.Log",
                Map.of(), null, null, deps, null, false);
    }
}
