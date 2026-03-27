package com.afkir.workflow.infra.persistence.log;

import com.afkir.workflow.engine.log.LogEventBroadcaster;
import com.afkir.workflow.engine.log.LogSink;
import com.afkir.workflow.domain.execution.ExecutionId;
import com.afkir.workflow.domain.log.LogEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class DbLogSink implements LogSink {

    private static final Logger log = LoggerFactory.getLogger(DbLogSink.class);

    private final LogJpaRepository repository;
    private final LogEventBroadcaster broadcaster;
    private final BlockingQueue<LogEvent> queue;
    private final AtomicLong droppedCount = new AtomicLong();

    @Value("${workflow.logs.flush-batch-size:200}")
    private int flushBatchSize;

    public DbLogSink(LogJpaRepository repository,
                     LogEventBroadcaster broadcaster,
                     @Value("${workflow.logs.buffer-capacity:2048}") int bufferCapacity) {
        this.repository = repository;
        this.broadcaster = broadcaster;
        this.queue = new ArrayBlockingQueue<>(bufferCapacity);
    }

    @Override
    public void append(LogEvent event) {
        if (!queue.offer(event)) {
            
            droppedCount.incrementAndGet();
        }
    }

    @Scheduled(fixedDelayString = "${workflow.logs.flush-interval:200}")
    @Transactional
    public void flush() {
        if (queue.isEmpty()) return;

        long dropped = droppedCount.getAndSet(0);
        if (dropped > 0) {
            log.warn("DbLogSink dropped {} log lines since last flush (buffer full)", dropped);
        }

        List<LogEvent> drained = new ArrayList<>(flushBatchSize);
        queue.drainTo(drained, flushBatchSize);
        if (drained.isEmpty()) return;

        var entities = drained.stream()
                .map(e -> new LogEntity(
                        e.executionId().value(), e.taskRunId(),
                        e.level(), e.message(), e.loggedAt()))
                .toList();

        List<LogEntity> saved;
        try {
            saved = repository.saveAll(entities);
        } catch (Exception e) {
            
            log.error("DbLogSink batch flush failed ({} events lost): {}",
                    drained.size(), e.getMessage());
            return;
        }

        for (int i = 0; i < saved.size(); i++) {
            var original = drained.get(i);
            var withId = original.withId(saved.get(i).getId());
            try {
                broadcaster.publish(withId);
            } catch (Throwable t) {
                
                log.warn("LogEventBroadcaster.publish failed for log id={}: {}",
                        withId.id(), t.getMessage());
            }
        }
    }
}
