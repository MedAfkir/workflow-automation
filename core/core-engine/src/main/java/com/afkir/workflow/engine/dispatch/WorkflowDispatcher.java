package com.afkir.workflow.engine.dispatch;

import com.afkir.workflow.engine.execution.WorkflowRunner;
import com.afkir.workflow.domain.execution.ExecutionId;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Component
@ConditionalOnProperty(prefix = "workflow.dispatcher", name = "enabled",
        havingValue = "true", matchIfMissing = true)
public class WorkflowDispatcher {

    private static final Logger log = LoggerFactory.getLogger(WorkflowDispatcher.class);

    private final ExecutionLeaseRepository leaseRepository;
    private final WorkflowRunner runner;
    private final ScheduledExecutorService poller;
    private final ExecutorService workerPool;
    private final String workerId;

    @Value("${workflow.dispatcher.poll-interval:PT2S}")
    private Duration pollInterval;

    @Value("${workflow.dispatcher.lease-ttl:PT5M}")
    private Duration leaseTtl;

    @Value("${workflow.dispatcher.batch-size:10}")
    private int batchSize;

    @Value("${workflow.dispatcher.shutdown-timeout:PT30S}")
    private Duration shutdownTimeout;

    public WorkflowDispatcher(ExecutionLeaseRepository leaseRepository,
                              WorkflowRunner runner) {
        this.leaseRepository = leaseRepository;
        this.runner = runner;
        this.workerId = "dispatcher-" + UUID.randomUUID().toString().substring(0, 8);

        this.poller = Executors.newSingleThreadScheduledExecutor(r -> {
            var t = new Thread(r, "workflow-dispatcher-poller");
            t.setDaemon(true);
            return t;
        });
        this.workerPool = Executors.newVirtualThreadPerTaskExecutor();
    }

    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        log.info("WorkflowDispatcher starting (workerId={}, poll={}, lease-ttl={}, batch-size={})",
                workerId, pollInterval, leaseTtl, batchSize);
        poller.scheduleWithFixedDelay(
                this::pollAndDispatch,
                0, pollInterval.toMillis(), TimeUnit.MILLISECONDS);
    }

    @PreDestroy
    public void stop() {
        log.info("WorkflowDispatcher stopping (workerId={})", workerId);
        poller.shutdown();
        try {
            if (!poller.awaitTermination(5, TimeUnit.SECONDS)) {
                poller.shutdownNow();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            poller.shutdownNow();
        }

        workerPool.shutdown();
        try {
            if (!workerPool.awaitTermination(shutdownTimeout.toSeconds(), TimeUnit.SECONDS)) {
                log.warn("Worker pool did not drain in {}; forcing shutdown", shutdownTimeout);
                workerPool.shutdownNow();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            workerPool.shutdownNow();
        }
    }

    void pollAndDispatch() {
        try {
            var ready = leaseRepository.leaseReady(workerId, leaseTtl, batchSize);
            for (var id : ready) {
                workerPool.submit(() -> runOne(id));
            }
            if (!ready.isEmpty()) {
                log.debug("Dispatched {} executions", ready.size());
            }
        } catch (Throwable t) {
            
            log.error("pollAndDispatch failed: {}", t.getMessage(), t);
        }
    }

    private void runOne(ExecutionId id) {
        var lease = new LeaseContext(workerId, leaseTtl);
        try {
            log.debug("Worker {} executing {}", workerId, id);
            runner.run(id, lease);
        } catch (Exception e) {
            log.error("Worker {} failed on execution {}: {}", workerId, id, e.getMessage(), e);
            
        }
    }

    public String workerId() {
        return workerId;
    }
}
