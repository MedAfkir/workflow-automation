package com.afkir.workflow.engine.trigger;

import com.afkir.workflow.engine.execution.ExecutionFactory;
import com.afkir.workflow.engine.runtime.EngineLogger;
import com.afkir.workflow.plugin.runtime.SecretResolver;
import com.afkir.workflow.plugin.trigger.PolledTrigger;
import com.afkir.workflow.plugin.trigger.TriggerEvaluation;
import com.afkir.workflow.domain.execution.ExecutionRepository;
import com.afkir.workflow.domain.trigger.Trigger;
import com.afkir.workflow.domain.trigger.TriggerRepository;
import com.afkir.workflow.domain.workflow.WorkflowId;
import com.afkir.workflow.domain.workflow.WorkflowRepository;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Component
public class TriggerEvaluator {

    private static final Logger log = LoggerFactory.getLogger(TriggerEvaluator.class);
    private static final SecretResolver NOOP_SECRETS = key -> Optional.empty();

    private final TriggerRepository triggerRepository;
    private final ExecutionRepository executionRepository;
    private final WorkflowRepository workflowRepository;
    private final ExecutionFactory executionFactory;
    private final TriggerPluginRegistry registry;
    private final ObjectMapper mapper;
    private final ScheduledExecutorService scheduler;

    @Value("${workflow.trigger.poll-interval:PT5S}")
    private Duration pollInterval;

    @Value("${workflow.trigger.enabled:true}")
    private boolean enabled;

    public TriggerEvaluator(TriggerRepository triggerRepository,
                            ExecutionRepository executionRepository,
                            WorkflowRepository workflowRepository,
                            ExecutionFactory executionFactory,
                            TriggerPluginRegistry registry,
                            ObjectMapper mapper) {
        this.triggerRepository = triggerRepository;
        this.executionRepository = executionRepository;
        this.workflowRepository = workflowRepository;
        this.executionFactory = executionFactory;
        this.registry = registry;
        this.mapper = mapper;
        this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            var t = new Thread(r, "trigger-evaluator");
            t.setDaemon(true);
            return t;
        });
    }

    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        if (!enabled) {
            log.info("TriggerEvaluator disabled");
            return;
        }
        log.info("TriggerEvaluator starting (poll={})", pollInterval);
        scheduler.scheduleWithFixedDelay(this::pollAndEvaluate,
                0, pollInterval.toMillis(), TimeUnit.MILLISECONDS);
    }

    @PreDestroy
    public void stop() {
        scheduler.shutdown();
        try {
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            scheduler.shutdownNow();
        }
    }

    @Transactional
    public void pollAndEvaluate() {
        try {
            var now = Instant.now();
            var ready = triggerRepository.findReadyToEvaluate(now, 50);
            if (ready.isEmpty()) return;

            log.debug("Evaluating {} triggers", ready.size());
            for (var trigger : ready) {
                try {
                    evaluateOne(trigger, now);
                } catch (Exception e) {
                    log.error("Error evaluating trigger {}: {}", trigger.id(), e.getMessage());
                    triggerRepository.save(trigger.withError(e.getMessage()));
                }
            }
        } catch (Throwable t) {
            log.error("Error in pollAndEvaluate: {}", t.getMessage(), t);
        }
    }

    private void evaluateOne(Trigger trigger, Instant now) {
        if (!registry.exists(trigger.type())) {
            log.warn("Unknown polled trigger type: {}", trigger.type());
            triggerRepository.save(trigger.withError("Unknown trigger type: " + trigger.type()));
            return;
        }

        var registered = registry.require(trigger.type());
        Object typedConfig;
        try {
            typedConfig = mapper.convertValue(trigger.config(), registered.configType());
        } catch (JacksonException | IllegalArgumentException e) {
            
            triggerRepository.save(trigger.withError("Invalid config: " + e.getMessage()));
            return;
        }

        var ctx = buildContext(trigger, typedConfig, now);

        @SuppressWarnings({"unchecked", "rawtypes"})
        TriggerEvaluation result = ((PolledTrigger) registered.instance()).evaluate(ctx);

        switch (result) {
            case TriggerEvaluation.Fire f -> handleFire(trigger, f, now);
            case TriggerEvaluation.Skip s ->
                    triggerRepository.save(trigger.evaluated(now).withNextEvaluation(s.nextEvaluation()));
            case TriggerEvaluation.Error e ->
                    triggerRepository.save(trigger.withError(e.message()));
        }
    }

    private void handleFire(Trigger trigger, TriggerEvaluation.Fire fire, Instant now) {
        log.info("Trigger {} firing for workflow {}", trigger.id(), trigger.workflowId());
        executionRepository.save(executionFactory.fromSchedule(trigger, fire.inputs()));
        triggerRepository.save(trigger.evaluated(now).withNextEvaluation(fire.nextEvaluation()));
    }

    private DefaultTriggerEvaluationContext<Object> buildContext(Trigger trigger,
                                                                 Object typedConfig,
                                                                 Instant now) {
        var workflow = workflowRepository.findById(new WorkflowId(trigger.workflowId().value()));
        String namespace = workflow.map(w -> w.namespaceKey().namespace()).orElse("unknown");
        String key = workflow.map(w -> w.namespaceKey().key()).orElse("unknown");

        return new DefaultTriggerEvaluationContext<>(
                typedConfig,
                EngineLogger.forTrigger(trigger.id() + ":" + trigger.triggerId()),
                NOOP_SECRETS,
                now,
                trigger.lastEvaluationAt(),
                namespace,
                key
        );
    }
}
