package com.afkir.workflow.engine.execution;

import com.afkir.workflow.engine.log.LogSink;
import com.afkir.workflow.engine.plugin.PluginRegistry;
import com.afkir.workflow.engine.runtime.CancellationToken;
import com.afkir.workflow.engine.runtime.EngineLogger;
import com.afkir.workflow.engine.runtime.RunContextImpl;
import com.afkir.workflow.engine.secrets.SecretResolverFactory;
import com.afkir.workflow.engine.templating.TemplateRenderer;
import com.afkir.workflow.engine.templating.TemplateResolutionException;
import com.afkir.workflow.plugin.error.PluginException;
import com.afkir.workflow.plugin.runtime.ExecutionInfo;
import com.afkir.workflow.plugin.task.RunnableTask;
import com.afkir.workflow.plugin.task.TaskOutput;
import com.afkir.workflow.domain.task.TaskDefinition;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;

@Component("workflowTaskExecutor")
public class TaskExecutor {

    private static final Logger log = LoggerFactory.getLogger(TaskExecutor.class);

    private final PluginRegistry registry;
    private final ObjectMapper mapper;
    private final TemplateRenderer renderer;
    private final SecretResolverFactory secretResolverFactory;
    private final LogSink logSink;

    public TaskExecutor(PluginRegistry registry,
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

    public TaskExecutionOutcome execute(TaskDefinition definition,
                                        ExecutionContext executionContext,
                                        CancellationToken cancellation) {
        var plugin = registry.require(definition.type());
        if (plugin.kind() != PluginRegistry.PluginKind.RUNNABLE) {
            throw new IllegalStateException(
                    "Task " + definition.id() + " is not a RunnableTask: " + plugin.kind());
        }

        Map<String, Object> resolvedConfig;
        try {
            resolvedConfig = renderer.resolve(
                    definition.config(),
                    executionContext.templateContext());
        } catch (TemplateResolutionException e) {
            
            return TaskExecutionOutcome.permanentFailure(
                    "TEMPLATE_RESOLUTION_FAILED",
                    e.getMessage(),
                    definition.config()
            );
        }

        Object typedInput;
        try {
            typedInput = mapper.convertValue(resolvedConfig, plugin.inputType());
        } catch (JacksonException | IllegalArgumentException e) {
            
            return TaskExecutionOutcome.permanentFailure(
                    "INVALID_CONFIG",
                    "Cannot map resolved config to input: " + e.getMessage(),
                    resolvedConfig
            );
        }

        var info = new ExecutionInfo(
                executionContext.executionId().value(),
                executionContext.taskRunId(),
                executionContext.workflowNamespace(),
                executionContext.workflowKey(),
                executionContext.workflowRevision(),
                definition.id().value(),
                1,
                java.time.Instant.now()
        );
        var context = buildContext(typedInput, info, executionContext, cancellation);

        @SuppressWarnings("unchecked")
        var task = (RunnableTask<Object, TaskOutput>) plugin.instance();

        try {
            log.debug("Executing task {} ({})", definition.id(), definition.type());
            var output = task.run(context);

            @SuppressWarnings("unchecked")
            var outputMap = (Map<String, Object>) mapper.convertValue(output, Map.class);

            return TaskExecutionOutcome.success(outputMap, resolvedConfig);

        } catch (PluginException e) {
            
            log.warn("Task {} failed (plugin exception, retryable={}): {}",
                    definition.id(), e.retryable(), e.getMessage());
            return new TaskExecutionOutcome.Failure(
                    e.errorCode(), e.getMessage(), resolvedConfig, e.retryable());

        } catch (InterruptedException e) {
            
            Thread.currentThread().interrupt();
            log.warn("Task {} was interrupted", definition.id());
            return TaskExecutionOutcome.permanentFailure(
                    "INTERRUPTED", "Task was interrupted", resolvedConfig);

        } catch (Exception e) {
            
            log.error("Task {} failed (unexpected): {}", definition.id(), e.getMessage(), e);
            return TaskExecutionOutcome.retryableFailure(
                    "UNEXPECTED_ERROR",
                    e.getClass().getSimpleName() + ": " + e.getMessage(),
                    resolvedConfig
            );
        }
    }

    private <I> RunContextImpl<I> buildContext(I input,
                                               ExecutionInfo info,
                                               ExecutionContext ec,
                                               CancellationToken cancellation) {
        
        var timeout = Duration.parse("PT5M");
        
        var secrets = secretResolverFactory.forNamespace(ec.workflowNamespace());
        return new RunContextImpl<>(
                input,
                EngineLogger.forExecution(ec.executionId(), ec.taskRunId(),
                        info.taskId(), logSink),
                secrets,
                RunContextImpl.noopStorage(),
                info,
                timeout,
                ec.previousOutputs(),
                ec.variables(),
                ec.workflowInputs(),
                cancellation
        );
    }
}
