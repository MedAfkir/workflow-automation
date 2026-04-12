package com.afkir.workflow.app.log;

import com.afkir.workflow.domain.execution.ExecutionId;
import com.afkir.workflow.domain.log.LogEvent;
import org.junit.jupiter.api.Test;
import reactor.core.Disposable;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.assertj.core.api.Assertions.assertThat;

class LogStreamHubTest {

    @Test
    void subscriber_only_receives_events_for_its_execution() {
        var hub = new LogStreamHub();
        var execA = ExecutionId.generate();
        var execB = ExecutionId.generate();

        StepVerifier.create(hub.streamFor(execA).take(2))
                .then(() -> {
                    hub.publish(line(execA, "for A #1"));
                    hub.publish(line(execB, "for B (should be filtered)"));
                    hub.publish(line(execA, "for A #2"));
                })
                .expectNextMatches(e -> e.message().equals("for A #1"))
                .expectNextMatches(e -> e.message().equals("for A #2"))
                .verifyComplete();
    }

    @Test
    void late_subscriber_receives_no_past_events() {
        
        var hub = new LogStreamHub();
        var execId = ExecutionId.generate();

        hub.publish(line(execId, "before subscriber"));
        hub.publish(line(execId, "still no subscriber"));

        StepVerifier.create(hub.streamFor(execId).take(Duration.ofMillis(200)))
                .verifyComplete();   
    }

    @Test
    void multiple_subscribers_on_same_execution_each_get_all_events() {
        var hub = new LogStreamHub();
        var execId = ExecutionId.generate();

        var seenByA = new CopyOnWriteArrayList<LogEvent>();
        var seenByB = new CopyOnWriteArrayList<LogEvent>();

        Disposable subA = hub.streamFor(execId).subscribe(seenByA::add);
        Disposable subB = hub.streamFor(execId).subscribe(seenByB::add);

        try {
            hub.publish(line(execId, "broadcast 1"));
            hub.publish(line(execId, "broadcast 2"));

            await(() -> seenByA.size() == 2 && seenByB.size() == 2);
        } finally {
            subA.dispose();
            subB.dispose();
        }

        assertThat(seenByA).extracting(LogEvent::message)
                .containsExactly("broadcast 1", "broadcast 2");
        assertThat(seenByB).extracting(LogEvent::message)
                .containsExactly("broadcast 1", "broadcast 2");
    }

    @Test
    void unsubscribed_client_no_longer_receives_events() {
        var hub = new LogStreamHub();
        var execId = ExecutionId.generate();
        var seen = new CopyOnWriteArrayList<LogEvent>();

        var sub = hub.streamFor(execId).subscribe(seen::add);
        hub.publish(line(execId, "received"));
        await(() -> seen.size() == 1);

        sub.dispose();
        hub.publish(line(execId, "missed because unsubscribed"));
        sleep(100);

        assertThat(seen).hasSize(1);
        assertThat(seen.get(0).message()).isEqualTo("received");
    }

    private static LogEvent line(ExecutionId execId, String message) {
        return new LogEvent(0L, execId, UUID.randomUUID(), "INFO", message, Instant.now());
    }

    private static void await(java.util.function.BooleanSupplier condition) {
        long deadline = System.currentTimeMillis() + 500;
        while (System.currentTimeMillis() < deadline) {
            if (condition.getAsBoolean()) return;
            sleep(10);
        }
        throw new AssertionError("condition never became true");
    }

    private static void sleep(long ms) {
        try { Thread.sleep(ms); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
