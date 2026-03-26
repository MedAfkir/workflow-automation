package com.afkir.workflow.engine.dispatch;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "workflow.dispatcher", name = "enabled",
        havingValue = "true", matchIfMissing = true)
public class ExecutionLeaseGarbageCollector {

    private static final Logger log = LoggerFactory.getLogger(ExecutionLeaseGarbageCollector.class);

    private final ExecutionLeaseRepository leaseRepository;

    public ExecutionLeaseGarbageCollector(ExecutionLeaseRepository leaseRepository) {
        this.leaseRepository = leaseRepository;
    }

    @Scheduled(fixedDelayString = "${workflow.dispatcher.gc-interval:PT1M}",
               initialDelayString = "PT30S")
    public void recoverOrphans() {
        try {
            int recovered = leaseRepository.recoverOrphanedExecutions();
            if (recovered > 0) {
                log.warn("Recovered {} orphaned RUNNING execution(s) with expired lease",
                        recovered);
            }
        } catch (Throwable t) {
            log.error("Lease GC tick failed: {}", t.getMessage(), t);
        }
    }
}
