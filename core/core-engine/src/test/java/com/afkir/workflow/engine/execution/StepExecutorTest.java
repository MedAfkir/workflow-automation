package com.afkir.workflow.engine.execution;

import com.afkir.workflow.engine.log.LogSink;
import com.afkir.workflow.engine.plugin.PluginRegistry;
import com.afkir.workflow.engine.runtime.CancellationToken;
import com.afkir.workflow.engine.runtime.RunContextImpl;
import com.afkir.workflow.engine.templating.TemplateRenderer;
import com.afkir.workflow.plugin.meta.Plugin;
import com.afkir.workflow.plugin.runtime.RunContext;
import com.afkir.workflow.plugin.task.RunnableTask;
import com.afkir.workflow.plugin.task.TaskOutput;
import com.afkir.workflow.plugin.builtin.task.ForEach;
import com.afkir.workflow.plugin.builtin.task.If;
import com.afkir.workflow.plugin.builtin.task.Log;
import com.afkir.workflow.plugin.builtin.task.Sleep;
import com.afkir.workflow.plugin.builtin.task.Wait;
import com.afkir.workflow.domain.execution.Execution;
import com.afkir.workflow.domain.execution.ExecutionId;
import com.afkir.workflow.domain.execution.TaskRun;
import com.afkir.workflow.domain.execution.TaskRunRepository;
import com.afkir.workflow.domain.execution.TaskRunState;
import com.afkir.workflow.domain.namespace.NamespaceKey;
import com.afkir.workflow.domain.task.TaskDefinition;
import com.afkir.workflow.domain.task.TaskId;
import com.afkir.workflow.domain.workflow.WorkflowDefinition;
import com.afkir.workflow.domain.workflow.WorkflowId;
import com.afkir.workflow.domain.workflow.WorkflowRevision;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

class StepExecutorTest {

    private InMemoryTaskRunRepository repo;
    private StepExecutor stepExecutor;

    @BeforeEach
    void setUp() {
        
        ObjectMapper mapper = JsonMapper.builder().build();
        var renderer = new IdentityRenderer();
        var registry = new PluginRegistry(
                List.of(new Log(), new Sleep(), new FailingPlugin(), new SlowSucceedPlugin()),
                List.of(new If(), new ForEach(), new Wait())
        );
        var taskExecutor = new TaskExecutor(registry, mapper, renderer,
                ns -> RunContextImpl.noopSecrets(), noopSink());
        var flowableExecutor = new FlowableExecutor(registry, mapper, renderer,
                ns -> RunContextImpl.noopSecrets(), noopSink());
        repo = new InMemoryTaskRunRepository();
        stepExecutor = new StepExecutor(taskExecutor, flowableExecutor, registry, repo);
    }

    @Test
    void foreach_with_concurrency_5_runs_10_sleeps_in_parallel_well_under_serial_time() throws Exception {
        
        int items = 10;
        var values = new java.util.ArrayList<Object>(items);
        for (int i = 0; i < items; i++) values.add(i);

        var foreachStep = flowableStep("io.workflowplatform.builtin.ForEach", Map.of(
                "values", values,
                "concurrency", 5,
                "tasks", List.of(Map.of(
                        "id", "sleep",
                        "type", "io.workflowplatform.builtin.Sleep",
                        "config", Map.of("duration", "PT1S")
                ))
        ));

        long t0 = System.currentTimeMillis();
        var result = stepExecutor.execute(foreachStep, freshGraph(foreachStep), execution(), new CancellationToken());
        long elapsedMs = System.currentTimeMillis() - t0;

        assertThat(result).isInstanceOf(StepResult.Continue.class);
        assertThat(elapsedMs)
                .as("10 x 1s sleeps with concurrency=5 should finish in ~2s, well under serial 10s")
                .isLessThan(4_500L)
                .isGreaterThanOrEqualTo(1_500L); 

        var aggregated = ((StepResult.Continue) result).outputs();
        assertThat(aggregated).hasSize(items);
        assertThat(aggregated).containsKeys("sleep_0", "sleep_5", "sleep_9");

        var parent = repo.findRoot();
        assertThat(parent.state()).isEqualTo(TaskRunState.SUCCESS);
        assertThat(parent.outputs()).hasSize(items);

        long succeededChildren = repo.all().stream()
                .filter(tr -> !tr.isRoot() && tr.state() == TaskRunState.SUCCESS)
                .count();
        assertThat(succeededChildren).isEqualTo(items);
    }

    @Test
    void foreach_concurrency_1_falls_back_to_sequential_spawn_for_runner_deque() {
        
        var foreachStep = flowableStep("io.workflowplatform.builtin.ForEach", Map.of(
                "values", List.of("a", "b"),
                "concurrency", 1,
                "tasks", List.of(Map.of(
                        "id", "log",
                        "type", "io.workflowplatform.builtin.Log",
                        "config", Map.of("message", "x")
                ))
        ));

        var result = stepExecutor.execute(foreachStep, freshGraph(foreachStep), execution(), new CancellationToken());

        assertThat(result).isInstanceOf(StepResult.Spawn.class);
        var spawn = (StepResult.Spawn) result;
        assertThat(spawn.children()).hasSize(2);

        var parent = repo.findRoot();
        assertThat(parent.state()).isEqualTo(TaskRunState.SUCCESS);
        assertThat(parent.outputs()).containsEntry("spawned", 2);

        long childRows = repo.all().stream().filter(tr -> !tr.isRoot()).count();
        assertThat(childRows).isZero();
    }

    @Test
    void foreach_parallel_with_one_failing_child_marks_parent_failed() {
        var foreachStep = flowableStep("io.workflowplatform.builtin.ForEach", Map.of(
                "values", List.of("ok", "boom", "ok"),
                "concurrency", 3,
                "tasks", List.of(Map.of(
                        "id", "child",
                        "type", "test.FailingPlugin",
                        "config", Map.of("failOn", "boom", "value", "{{ value }}")
                ))
        ));

        var result = stepExecutor.execute(foreachStep, freshGraph(foreachStep), execution(), new CancellationToken());

        assertThat(result).isInstanceOf(StepResult.Fail.class);
        var fail = (StepResult.Fail) result;
        assertThat(fail.message()).contains("child_1");

        var parent = repo.findRoot();
        assertThat(parent.state()).isEqualTo(TaskRunState.FAILED);
    }

    @Test
    void foreach_parallel_caps_active_children_at_concurrency() throws Exception {
        
        SlowSucceedPlugin.reset();
        int items = 10;
        var values = new java.util.ArrayList<Object>(items);
        for (int i = 0; i < items; i++) values.add(i);

        var foreachStep = flowableStep("io.workflowplatform.builtin.ForEach", Map.of(
                "values", values,
                "concurrency", 3,
                "tasks", List.of(Map.of(
                        "id", "tracked",
                        "type", "test.SlowSucceedPlugin",
                        "config", Map.of("durationMs", 200)
                ))
        ));

        var result = stepExecutor.execute(foreachStep, freshGraph(foreachStep), execution(), new CancellationToken());

        assertThat(result).isInstanceOf(StepResult.Continue.class);
        assertThat(SlowSucceedPlugin.peakActive())
                .as("Semaphore must cap simultaneous children at concurrency")
                .isLessThanOrEqualTo(3);
        assertThat(SlowSucceedPlugin.totalRuns()).isEqualTo(items);
    }

    private static LogSink noopSink() {
        return event -> {  };
    }

    private ScheduledStep flowableStep(String type, Map<String, Object> config) {
        var def = TaskDefinition.of(new TaskId("flowable"), type, config, null, null);
        return ScheduledStep.root(def);
    }

    private Execution execution() {
        return Execution.create(WorkflowId.generate(), UUID.randomUUID(),
                "MANUAL", null, Map.of());
    }

    private ExecutionGraph freshGraph(ScheduledStep step) {
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

    private static final class InMemoryTaskRunRepository implements TaskRunRepository {
        private final Map<UUID, TaskRun> store = new LinkedHashMap<>();

        @Override
        public synchronized TaskRun save(TaskRun taskRun) {
            store.put(taskRun.id(), taskRun);
            return taskRun;
        }

        @Override
        public synchronized List<TaskRun> findByExecutionIdOrderBySequence(ExecutionId executionId) {
            return store.values().stream()
                    .filter(tr -> tr.executionId().equals(executionId))
                    .sorted(java.util.Comparator.comparingInt(TaskRun::sequence))
                    .toList();
        }

        synchronized List<TaskRun> all() {
            return List.copyOf(store.values());
        }

        TaskRun findRoot() {
            return all().stream().filter(TaskRun::isRoot).findFirst().orElseThrow();
        }
    }

    private static final class IdentityRenderer implements TemplateRenderer {
        private static final java.util.regex.Pattern TPL =
                java.util.regex.Pattern.compile("\\{\\{\\s*([\\w.]+)\\s*}}");

        @Override
        public Map<String, Object> resolve(Map<String, Object> config, Map<String, Object> ctx) {
            var out = new LinkedHashMap<String, Object>();
            for (var e : config.entrySet()) out.put(e.getKey(), resolveVal(e.getValue(), ctx));
            return out;
        }

        private Object resolveVal(Object v, Map<String, Object> ctx) {
            if (v instanceof String s) {
                var m = TPL.matcher(s);
                var sb = new StringBuilder();
                while (m.find()) {
                    var path = m.group(1);
                    Object cur = ctx;
                    for (var part : path.split("\\.")) {
                        if (cur instanceof Map<?, ?> map) cur = ((Map<?, ?>) map).get(part);
                        else { cur = null; break; }
                    }
                    m.appendReplacement(sb, java.util.regex.Matcher.quoteReplacement(String.valueOf(cur)));
                }
                m.appendTail(sb);
                return sb.toString();
            }
            if (v instanceof List<?> l) {
                var out = new java.util.ArrayList<Object>(l.size());
                for (var x : l) out.add(resolveVal(x, ctx));
                return out;
            }
            if (v instanceof Map<?, ?> m) {
                @SuppressWarnings("unchecked")
                var out = resolve((Map<String, Object>) m, ctx);
                return out;
            }
            return v;
        }
    }

    @Plugin(id = "test.FailingPlugin", version = "1.0.0")
    public static class FailingPlugin implements RunnableTask<FailingPlugin.Input, FailingPlugin.Out> {
        public record Input(String failOn, String value) {}
        public record Out(String value) implements TaskOutput {}

        @Override
        public Out run(RunContext<Input> ctx) {
            if (ctx.input().failOn() != null && ctx.input().failOn().equals(ctx.input().value())) {
                throw new com.afkir.workflow.plugin.error.NonRetryableException(
                        "BOOM", "Fail requested for value=" + ctx.input().value());
            }
            return new Out(ctx.input().value());
        }
    }

    @Plugin(id = "test.SlowSucceedPlugin", version = "1.0.0")
    public static class SlowSucceedPlugin implements RunnableTask<SlowSucceedPlugin.Input, SlowSucceedPlugin.Out> {
        private static final AtomicInteger active = new AtomicInteger();
        private static final AtomicInteger peak = new AtomicInteger();
        private static final AtomicInteger total = new AtomicInteger();

        public record Input(int durationMs) {}
        public record Out(int durationMs) implements TaskOutput {}

        public static void reset() { active.set(0); peak.set(0); total.set(0); }
        public static int peakActive() { return peak.get(); }
        public static int totalRuns() { return total.get(); }

        @Override
        public Out run(RunContext<Input> ctx) throws InterruptedException {
            int now = active.incrementAndGet();
            peak.updateAndGet(p -> Math.max(p, now));
            try {
                Thread.sleep(ctx.input().durationMs());
                total.incrementAndGet();
                return new Out(ctx.input().durationMs());
            } finally {
                active.decrementAndGet();
            }
        }
    }

}
