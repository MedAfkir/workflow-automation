package com.afkir.workflow.engine.execution;

import com.afkir.workflow.engine.plugin.PluginRegistry;
import com.afkir.workflow.engine.runtime.RunContextImpl;
import com.afkir.workflow.engine.secrets.SecretResolverFactory;
import com.afkir.workflow.engine.templating.TemplateRenderer;
import com.afkir.workflow.engine.templating.TemplateResolutionException;
import com.afkir.workflow.plugin.task.FlowableResult;
import com.afkir.workflow.plugin.task.FlowableTask;
import com.afkir.workflow.plugin.task.RunnableTask;
import com.afkir.workflow.plugin.task.TaskOutput;
import com.afkir.workflow.plugin.builtin.task.ForEach;
import com.afkir.workflow.plugin.builtin.task.If;
import com.afkir.workflow.plugin.builtin.task.Log;
import com.afkir.workflow.plugin.builtin.task.Switch;
import com.afkir.workflow.plugin.builtin.task.Wait;
import com.afkir.workflow.plugin.runtime.RunContext;
import com.afkir.workflow.plugin.meta.Plugin;
import com.afkir.workflow.domain.execution.Execution;
import com.afkir.workflow.domain.namespace.NamespaceKey;
import com.afkir.workflow.domain.task.TaskDefinition;
import com.afkir.workflow.domain.task.TaskId;
import com.afkir.workflow.domain.workflow.WorkflowDefinition;
import com.afkir.workflow.domain.workflow.WorkflowId;
import com.afkir.workflow.domain.workflow.WorkflowRevision;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FlowableExecutorTest {

    private FlowableExecutor executor;
    private PluginRegistry registry;

    @BeforeEach
    void setUp() {
        
        registry = new PluginRegistry(
                List.of(new Log(), new RunnableStub()),
                List.of(new If(), new ForEach(), new Wait(), new Switch())
        );
        executor = new FlowableExecutor(
                registry,
                objectMapper(),
                new StubTemplateRenderer(),
                ns -> RunContextImpl.noopSecrets(),
                noopSink()
        );
    }

    @Test
    void if_with_true_condition_spawns_then_branch() {
        var step = flowableStep("io.workflowplatform.builtin.If", Map.of(
                "condition", "true",
                "then", List.of(Map.of(
                        "id", "log_yes",
                        "type", "io.workflowplatform.builtin.Log",
                        "config", Map.of("message", "yes")
                )),
                "else", List.of(Map.of(
                        "id", "log_no",
                        "type", "io.workflowplatform.builtin.Log",
                        "config", Map.of("message", "no")
                ))
        ));

        var result = executor.execute(step, freshPlan(step), execution(), UUID.randomUUID());

        assertThat(result).isInstanceOf(StepResult.Spawn.class);
        var spawn = (StepResult.Spawn) result;
        assertThat(spawn.children()).hasSize(1);
        assertThat(spawn.children().get(0).taskDef().id().value()).isEqualTo("log_yes");
    }

    @Test
    void if_with_false_condition_spawns_else_branch() {
        var step = flowableStep("io.workflowplatform.builtin.If", Map.of(
                "condition", "false",
                "then", List.of(Map.of("id", "log_yes", "type", "io.workflowplatform.builtin.Log", "config", Map.of())),
                "else", List.of(Map.of("id", "log_no", "type", "io.workflowplatform.builtin.Log", "config", Map.of()))
        ));

        var result = executor.execute(step, freshPlan(step), execution(), UUID.randomUUID());

        var spawn = (StepResult.Spawn) result;
        assertThat(spawn.children()).hasSize(1);
        assertThat(spawn.children().get(0).taskDef().id().value()).isEqualTo("log_no");
    }

    @Test
    void if_with_pebble_template_resolves_to_branch() {
        
        var step = flowableStep("io.workflowplatform.builtin.If", Map.of(
                "condition", "{{ inputs.flag }}",
                "then", List.of(Map.of("id", "yes", "type", "io.workflowplatform.builtin.Log", "config", Map.of())),
                "else", List.of(Map.of("id", "no", "type", "io.workflowplatform.builtin.Log", "config", Map.of()))
        ));
        var exec = executionWithInputs(Map.of("flag", "true"));

        var result = executor.execute(step, freshPlan(step), exec, UUID.randomUUID());

        var spawn = (StepResult.Spawn) result;
        assertThat(spawn.children().get(0).taskDef().id().value()).isEqualTo("yes");
    }

    @Test
    void if_with_empty_branch_returns_complete() {
        var step = flowableStep("io.workflowplatform.builtin.If", Map.of(
                "condition", "true",
                "then", List.of(),
                "else", List.of(Map.of("id", "no", "type", "io.workflowplatform.builtin.Log", "config", Map.of()))
        ));

        var result = executor.execute(step, freshPlan(step), execution(), UUID.randomUUID());

        assertThat(result).isInstanceOf(StepResult.Continue.class);
        var cont = (StepResult.Continue) result;
        assertThat(cont.outputs()).containsEntry("matched", true);
    }

    @Test
    void if_subtask_configs_are_NOT_templated_at_evaluation_time() {
        
        var step = flowableStep("io.workflowplatform.builtin.If", Map.of(
                "condition", "true",
                "then", List.of(Map.of(
                        "id", "log",
                        "type", "io.workflowplatform.builtin.Log",
                        "config", Map.of("message", "{{ value }}")
                ))
        ));

        var result = executor.execute(step, freshPlan(step), execution(), UUID.randomUUID());

        var spawn = (StepResult.Spawn) result;
        var childConfig = spawn.children().get(0).taskDef().config();
        assertThat(childConfig).containsEntry("message", "{{ value }}");
    }

    @Test
    void foreach_emits_one_step_per_iteration_with_value_and_index_overrides() {
        var step = flowableStep("io.workflowplatform.builtin.ForEach", Map.of(
                "values", List.of("a", "b", "c"),
                "concurrency", 1,
                "tasks", List.of(Map.of(
                        "id", "item",
                        "type", "io.workflowplatform.builtin.Log",
                        "config", Map.of("message", "{{ value }}")
                ))
        ));

        var result = executor.execute(step, freshPlan(step), execution(), UUID.randomUUID());

        var children = ((StepResult.Spawn) result).children();
        assertThat(children).hasSize(3);

        assertThat(children.get(0).taskDef().id().value()).isEqualTo("item_0");
        assertThat(children.get(0).iteration()).isEqualTo(0);
        assertThat(children.get(0).contextOverrides())
                .containsEntry("value", "a")
                .containsEntry("index", 0);

        assertThat(children.get(2).taskDef().id().value()).isEqualTo("item_2");
        assertThat(children.get(2).iteration()).isEqualTo(2);
        assertThat(children.get(2).contextOverrides())
                .containsEntry("value", "c")
                .containsEntry("index", 2);
    }

    @Test
    void foreach_children_inherit_parent_task_run_id() {
        var step = flowableStep("io.workflowplatform.builtin.ForEach", Map.of(
                "values", List.of(1, 2),
                "tasks", List.of(Map.of("id", "log", "type", "io.workflowplatform.builtin.Log", "config", Map.of()))
        ));
        var parentTaskRunId = UUID.randomUUID();

        var result = executor.execute(step, freshPlan(step), execution(), parentTaskRunId);

        var children = ((StepResult.Spawn) result).children();
        assertThat(children).allSatisfy(child ->
                assertThat(child.parentTaskRunId()).isEqualTo(parentTaskRunId));
    }

    @Test
    void foreach_propagates_concurrency_into_spawn_for_step_executor_to_consume() {
        
        var step = flowableStep("io.workflowplatform.builtin.ForEach", Map.of(
                "values", List.of("a", "b", "c"),
                "concurrency", 5,
                "tasks", List.of(Map.of("id", "log", "type", "io.workflowplatform.builtin.Log", "config", Map.of()))
        ));

        var result = executor.execute(step, freshPlan(step), execution(), UUID.randomUUID());

        var spawn = (StepResult.Spawn) result;
        assertThat(spawn.concurrency()).isEqualTo(5);
        assertThat(spawn.children()).hasSize(3);
    }

    @Test
    void if_propagates_null_concurrency_so_branches_run_sequentially() {
        
        var step = flowableStep("io.workflowplatform.builtin.If", Map.of(
                "condition", "true",
                "then", List.of(Map.of("id", "a", "type", "io.workflowplatform.builtin.Log", "config", Map.of()))
        ));

        var result = executor.execute(step, freshPlan(step), execution(), UUID.randomUUID());

        var spawn = (StepResult.Spawn) result;
        assertThat(spawn.concurrency()).isNull();
    }

    @Test
    void foreach_with_empty_values_returns_spawn_of_zero_children() {
        var step = flowableStep("io.workflowplatform.builtin.ForEach", Map.of(
                "values", List.of(),
                "tasks", List.of(Map.of("id", "log", "type", "io.workflowplatform.builtin.Log", "config", Map.of()))
        ));

        var result = executor.execute(step, freshPlan(step), execution(), UUID.randomUUID());

        assertThat(((StepResult.Spawn) result).children()).isEmpty();
    }

    @Test
    void wait_returns_step_result_wait_with_resolved_instant() {
        var step = flowableStep("io.workflowplatform.builtin.Wait", Map.of(
                "duration", "PT5M"
        ));
        var before = Instant.now();

        var result = executor.execute(step, freshPlan(step), execution(), UUID.randomUUID());

        assertThat(result).isInstanceOf(StepResult.Wait.class);
        var wait = (StepResult.Wait) result;
        var expectedMin = before.plus(Duration.ofMinutes(5)).minusSeconds(1);
        var expectedMax = Instant.now().plus(Duration.ofMinutes(5)).plusSeconds(1);
        assertThat(wait.until()).isBetween(expectedMin, expectedMax);
    }

    @Test
    void wait_with_invalid_duration_returns_INVALID_CONFIG_fail() {
        
        var step = flowableStep("io.workflowplatform.builtin.Wait", Map.of(
                "duration", "PT0S"
        ));

        var result = executor.execute(step, freshPlan(step), execution(), UUID.randomUUID());

        assertThat(result).isInstanceOf(StepResult.Fail.class);
        var fail = (StepResult.Fail) result;
        assertThat(fail.code()).isEqualTo("INVALID_CONFIG");
    }

    @Test
    void switch_spawns_the_branch_matching_the_value() {
        var step = flowableStep("io.workflowplatform.builtin.Switch", Map.of(
                "value", "OK",
                "cases", Map.of(
                        "OK", List.of(Map.of(
                                "id", "log_ok",
                                "type", "io.workflowplatform.builtin.Log",
                                "config", Map.of("message", "ok"))),
                        "ERR", List.of(Map.of(
                                "id", "log_err",
                                "type", "io.workflowplatform.builtin.Log",
                                "config", Map.of("message", "err")))),
                "default", List.of(Map.of(
                        "id", "log_default",
                        "type", "io.workflowplatform.builtin.Log",
                        "config", Map.of("message", "default")))
        ));

        var result = executor.execute(step, freshPlan(step), execution(), UUID.randomUUID());

        var spawn = (StepResult.Spawn) result;
        assertThat(spawn.children()).hasSize(1);
        assertThat(spawn.children().get(0).taskDef().id().value()).isEqualTo("log_ok");
        
        assertThat(spawn.concurrency()).isNull();
    }

    @Test
    void switch_falls_back_to_default_when_no_case_matches() {
        var step = flowableStep("io.workflowplatform.builtin.Switch", Map.of(
                "value", "WHATEVER",
                "cases", Map.of(
                        "OK", List.of(Map.of("id", "log_ok", "type", "io.workflowplatform.builtin.Log", "config", Map.of()))),
                "default", List.of(Map.of("id", "log_default", "type", "io.workflowplatform.builtin.Log", "config", Map.of()))
        ));

        var result = executor.execute(step, freshPlan(step), execution(), UUID.randomUUID());

        var spawn = (StepResult.Spawn) result;
        assertThat(spawn.children()).hasSize(1);
        assertThat(spawn.children().get(0).taskDef().id().value()).isEqualTo("log_default");
    }

    @Test
    void switch_with_no_match_and_no_default_returns_complete_echoing_the_value() {
        var step = flowableStep("io.workflowplatform.builtin.Switch", Map.of(
                "value", "NOPE",
                "cases", Map.of(
                        "OK", List.of(Map.of("id", "log_ok", "type", "io.workflowplatform.builtin.Log", "config", Map.of())))
        ));

        var result = executor.execute(step, freshPlan(step), execution(), UUID.randomUUID());

        assertThat(result).isInstanceOf(StepResult.Continue.class);
        var cont = (StepResult.Continue) result;
        assertThat(cont.outputs()).containsEntry("matched", "NOPE");
    }

    @Test
    void switch_resolves_pebble_value_before_matching() {
        var step = flowableStep("io.workflowplatform.builtin.Switch", Map.of(
                "value", "{{ inputs.status }}",
                "cases", Map.of(
                        "ACTIVE", List.of(Map.of("id", "on", "type", "io.workflowplatform.builtin.Log", "config", Map.of())),
                        "INACTIVE", List.of(Map.of("id", "off", "type", "io.workflowplatform.builtin.Log", "config", Map.of())))
        ));
        var exec = executionWithInputs(Map.of("status", "ACTIVE"));

        var result = executor.execute(step, freshPlan(step), exec, UUID.randomUUID());

        var spawn = (StepResult.Spawn) result;
        assertThat(spawn.children().get(0).taskDef().id().value()).isEqualTo("on");
    }

    @Test
    void switch_subtask_configs_in_cases_are_NOT_templated_at_evaluation_time() {
        
        var step = flowableStep("io.workflowplatform.builtin.Switch", Map.of(
                "value", "OK",
                "cases", Map.of(
                        "OK", List.of(Map.of(
                                "id", "log",
                                "type", "io.workflowplatform.builtin.Log",
                                "config", Map.of("message", "{{ value }}"))))
        ));

        var result = executor.execute(step, freshPlan(step), execution(), UUID.randomUUID());

        var spawn = (StepResult.Spawn) result;
        var childConfig = spawn.children().get(0).taskDef().config();
        assertThat(childConfig).containsEntry("message", "{{ value }}");
    }

    @Test
    void runnable_plugin_dispatched_to_flowable_executor_throws_illegal_state() {
        var step = flowableStep("io.workflowplatform.builtin.Log", Map.of(
                "message", "hi"
        ));

        assertThatThrownBy(() ->
                executor.execute(step, freshPlan(step), execution(), UUID.randomUUID()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not a FlowableTask");
    }

    @Test
    void plugin_throwing_unexpected_exception_returns_FLOWABLE_FAILED() {
        
        var executor = new FlowableExecutor(
                new PluginRegistry(List.of(), List.of(new ThrowingFlowable())),
                objectMapper(),
                new StubTemplateRenderer(),
                ns -> RunContextImpl.noopSecrets(),
                noopSink()
        );
        var step = flowableStep("test.ThrowingFlowable", Map.of());

        var result = executor.execute(step, freshPlan(step), execution(), UUID.randomUUID());

        assertThat(result).isInstanceOf(StepResult.Fail.class);
        assertThat(((StepResult.Fail) result).code()).isEqualTo("FLOWABLE_FAILED");
    }

    @Test
    void template_resolution_failure_returns_TEMPLATE_RESOLUTION_FAILED() {
        var executor = new FlowableExecutor(
                registry,
                objectMapper(),
                new ThrowingTemplateRenderer(),
                ns -> RunContextImpl.noopSecrets(),
                noopSink()
        );
        var step = flowableStep("io.workflowplatform.builtin.If", Map.of(
                "condition", "true",
                "then", List.of()
        ));

        var result = executor.execute(step, freshPlan(step), execution(), UUID.randomUUID());

        assertThat(result).isInstanceOf(StepResult.Fail.class);
        assertThat(((StepResult.Fail) result).code()).isEqualTo("TEMPLATE_RESOLUTION_FAILED");
    }

    private static ObjectMapper objectMapper() {
        return tools.jackson.databind.json.JsonMapper.builder().build();
    }

    private static com.afkir.workflow.engine.log.LogSink noopSink() {
        return event -> {  };
    }

    private ScheduledStep flowableStep(String type, Map<String, Object> config) {
        var def = TaskDefinition.of(new TaskId("flowable"), type, config, null, null);
        return ScheduledStep.root(def);
    }

    private Execution execution() {
        return executionWithInputs(Map.of());
    }

    private Execution executionWithInputs(Map<String, Object> inputs) {
        return Execution.create(WorkflowId.generate(), UUID.randomUUID(),
                "MANUAL", null, inputs);
    }

    private ExecutionGraph freshPlan(ScheduledStep step) {
        var def = WorkflowDefinition.of(
                new NamespaceKey("test", "wf"),
                "desc", Map.of(), Map.of(),
                List.of(step.taskDef()),
                List.of(), List.of()
        );
        var revision = new WorkflowRevision(
                UUID.randomUUID(), WorkflowId.generate(), 1,
                "yaml: not used", def, "hash", Instant.now()
        );
        return ExecutionGraph.resume(execution(), revision, List.of());
    }

    private static final class StubTemplateRenderer implements TemplateRenderer {
        private static final Pattern TPL = Pattern.compile("\\{\\{\\s*([\\w.]+)\\s*}}");

        @Override
        public Map<String, Object> resolve(Map<String, Object> config, Map<String, Object> ctx) {
            var out = new java.util.LinkedHashMap<String, Object>();
            for (var e : config.entrySet()) {
                out.put(e.getKey(), resolveValue(e.getValue(), ctx));
            }
            return out;
        }

        private Object resolveValue(Object v, Map<String, Object> ctx) {
            if (v instanceof String s) return resolveString(s, ctx);
            if (v instanceof List<?> l) {
                var rl = new java.util.ArrayList<>(l.size());
                for (var item : l) rl.add(resolveValue(item, ctx));
                return rl;
            }
            if (v instanceof Map<?, ?> m) {
                @SuppressWarnings("unchecked")
                var rm = resolve((Map<String, Object>) m, ctx);
                return rm;
            }
            return v;
        }

        private String resolveString(String s, Map<String, Object> ctx) {
            Matcher m = TPL.matcher(s);
            var sb = new StringBuilder();
            while (m.find()) {
                var path = m.group(1);
                var resolved = lookup(path, ctx);
                m.appendReplacement(sb, Matcher.quoteReplacement(String.valueOf(resolved)));
            }
            m.appendTail(sb);
            return sb.toString();
        }

        @SuppressWarnings("unchecked")
        private Object lookup(String path, Map<String, Object> ctx) {
            Object cur = ctx;
            for (var part : path.split("\\.")) {
                if (cur instanceof Map<?, ?> m) cur = ((Map<String, Object>) m).get(part);
                else return null;
            }
            return cur;
        }
    }

    private static final class ThrowingTemplateRenderer implements TemplateRenderer {
        @Override
        public Map<String, Object> resolve(Map<String, Object> config, Map<String, Object> ctx) {
            throw new TemplateResolutionException("boom");
        }
    }

    @Plugin(id = "test.RunnableStub", version = "1.0.0")
    static class RunnableStub implements RunnableTask<RunnableStub.Input, RunnableStub.Out> {
        public record Input() {}
        public record Out(String s) implements TaskOutput {}

        @Override
        public Out run(RunContext<Input> ctx) {
            return new Out("ok");
        }
    }

    @Plugin(id = "test.ThrowingFlowable", version = "1.0.0")
    static class ThrowingFlowable implements FlowableTask<ThrowingFlowable.Input> {
        public record Input() {}

        @Override
        public FlowableResult evaluate(RunContext<Input> ctx) {
            throw new IllegalStateException("boom from plugin");
        }
    }
}
