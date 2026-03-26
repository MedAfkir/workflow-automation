package com.afkir.workflow.engine.execution;

import com.afkir.workflow.engine.log.LogSink;
import com.afkir.workflow.engine.plugin.PluginRegistry;
import com.afkir.workflow.engine.runtime.CancellationToken;
import com.afkir.workflow.engine.runtime.EngineLogger;
import com.afkir.workflow.engine.runtime.RunContextImpl;
import com.afkir.workflow.engine.secrets.SecretResolverFactory;
import com.afkir.workflow.engine.templating.TemplateRenderer;
import com.afkir.workflow.engine.templating.TemplateResolutionException;
import com.afkir.workflow.plugin.runtime.ExecutionInfo;
import com.afkir.workflow.plugin.task.FlowableResult;
import com.afkir.workflow.plugin.task.FlowableTask;
import com.afkir.workflow.plugin.task.SubTaskDefinition;
import com.afkir.workflow.domain.execution.Execution;
import com.afkir.workflow.domain.task.TaskDefinition;
import com.afkir.workflow.domain.task.TaskId;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
public class FlowableExecutor {

    private static final Logger log = LoggerFactory.getLogger(FlowableExecutor.class);

    private static final Set<String> SUBTASK_KEYS =
            Set.of("tasks", "then", "else", "cases", "default");

    private static final Duration FLOWABLE_TIMEOUT = Duration.ofSeconds(30);

    private final PluginRegistry registry;
    private final ObjectMapper mapper;
    private final TemplateRenderer renderer;
    private final SecretResolverFactory secretResolverFactory;
    private final LogSink logSink;

    public FlowableExecutor(PluginRegistry registry,
                            ObjectMapper mapper,
                            TemplateRenderer renderer,
                            SecretResolverFactory secretResolverFactory,
                            LogSink logSink) {
        this.registry = registry;
        this.mapper = mapper;
        this.renderer = renderer;
        this.secretResolverFactory = secretResolverFactory;
        this.logSink = logSink;
    }

    public StepResult execute(ScheduledStep step,
                              ExecutionGraph graph,
                              Execution execution,
                              UUID flowableTaskRunId) {
        var plugin = registry.require(step.taskDef().type());
        if (plugin.kind() != PluginRegistry.PluginKind.FLOWABLE) {
            throw new IllegalStateException(
                    "Task " + step.taskDef().id() + " is not a FlowableTask: " + plugin.kind());
        }

        var ec = graph.buildContext(execution, flowableTaskRunId, step.contextOverrides());

        Map<String, Object> resolvedConfig;
        try {
            resolvedConfig = renderControlFields(step.taskDef().config(), ec.templateContext());
        } catch (TemplateResolutionException e) {
            return new StepResult.Fail("TEMPLATE_RESOLUTION_FAILED", e.getMessage());
        }

        Object typedInput;
        try {
            typedInput = mapper.convertValue(resolvedConfig, plugin.inputType());
        } catch (JacksonException | IllegalArgumentException e) {
            return new StepResult.Fail("INVALID_CONFIG",
                    "Cannot map resolved config to flowable input: " + e.getMessage());
        }

        var info = new ExecutionInfo(
                ec.executionId().value(),
                flowableTaskRunId,
                ec.workflowNamespace(),
                ec.workflowKey(),
                ec.workflowRevision(),
                step.taskDef().id().value(),
                1,
                Instant.now()
        );
        var secrets = secretResolverFactory.forNamespace(ec.workflowNamespace());
        var runCtx = new RunContextImpl<>(
                typedInput,
                EngineLogger.forExecution(ec.executionId(), ec.taskRunId(),
                        info.taskId(), logSink),
                secrets,
                RunContextImpl.noopStorage(),
                info,
                FLOWABLE_TIMEOUT,
                ec.previousOutputs(),
                ec.variables(),
                ec.workflowInputs(),
                new CancellationToken()
        );

        FlowableResult result;
        try {
            log.debug("Evaluating flowable {} ({})",
                    step.taskDef().id().value(), step.taskDef().type());
            @SuppressWarnings({"unchecked", "rawtypes"})
            var task = (FlowableTask) plugin.instance();
            @SuppressWarnings("unchecked")
            FlowableResult r = task.evaluate(runCtx);
            result = r;
        } catch (Exception e) {
            log.warn("Flowable {} threw: {}", step.taskDef().id(), e.getMessage(), e);
            return new StepResult.Fail("FLOWABLE_FAILED",
                    e.getClass().getSimpleName() + ": " + e.getMessage());
        }

        return translate(result, step, flowableTaskRunId);
    }

    private Map<String, Object> renderControlFields(Map<String, Object> rawConfig,
                                                    Map<String, Object> templateCtx) {
        var toRender = new LinkedHashMap<String, Object>();
        var passthrough = new LinkedHashMap<String, Object>();
        for (var entry : rawConfig.entrySet()) {
            if (SUBTASK_KEYS.contains(entry.getKey())) {
                passthrough.put(entry.getKey(), entry.getValue());
            } else {
                toRender.put(entry.getKey(), entry.getValue());
            }
        }
        var result = new LinkedHashMap<>(renderer.resolve(toRender, templateCtx));
        result.putAll(passthrough);
        return result;
    }

    private StepResult translate(FlowableResult result,
                                 ScheduledStep parent,
                                 UUID flowableTaskRunId) {
        return switch (result) {
            case FlowableResult.SpawnTasks spawn -> spawnChildren(spawn, flowableTaskRunId);
            case FlowableResult.Complete complete -> new StepResult.Continue(toMap(complete.outputs()));
            case FlowableResult.WaitFor waitFor -> new StepResult.Wait(Instant.now().plus(waitFor.duration()));
            case FlowableResult.WaitForSignal sig ->
                    new StepResult.Fail("SIGNAL_NOT_SUPPORTED",
                            "WaitForSignal '" + sig.signalName() + "' is not yet supported");
            case FlowableResult.Fail fail -> new StepResult.Fail(fail.errorCode(), fail.message());
        };
    }

    private StepResult spawnChildren(FlowableResult.SpawnTasks spawn,
                                     UUID flowableTaskRunId) {
        var children = spawn.tasks().stream()
                .map(sub -> toScheduledStep(sub, flowableTaskRunId))
                .toList();
        return new StepResult.Spawn(children, spawn.concurrency());
    }

    private ScheduledStep toScheduledStep(SubTaskDefinition sub, UUID parentTaskRunId) {
        
        var taskDef = TaskDefinition.of(
                new TaskId(sub.taskId()),
                sub.type(),
                sub.config(),
                null,
                null
        );
        Integer iteration = null;
        var maybeIndex = sub.contextOverrides().get("index");
        if (maybeIndex instanceof Integer i) iteration = i;
        else if (maybeIndex instanceof Number n) iteration = n.intValue();
        return ScheduledStep.child(taskDef, parentTaskRunId, iteration,
                sub.contextOverrides());
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> toMap(Object outputs) {
        if (outputs == null) return Map.of();
        if (outputs instanceof Map<?, ?> m) return Map.copyOf((Map<String, Object>) m);
        
        return mapper.convertValue(outputs, Map.class);
    }
}
