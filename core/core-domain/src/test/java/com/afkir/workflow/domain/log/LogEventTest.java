package com.afkir.workflow.domain.log;

import com.afkir.workflow.domain.execution.ExecutionId;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LogEventTest {

    @Test
    void submit_creates_unpersisted_event_with_zero_id() {
        var execId = ExecutionId.generate();
        var before = Instant.now();

        var e = LogEvent.submit(execId, null, "INFO", "hello");

        assertThat(e.id()).isZero();
        assertThat(e.isPersisted()).isFalse();
        assertThat(e.executionId()).isEqualTo(execId);
        assertThat(e.taskRunId()).isNull();
        assertThat(e.level()).isEqualTo("INFO");
        assertThat(e.message()).isEqualTo("hello");
        assertThat(e.loggedAt()).isAfterOrEqualTo(before);
    }

    @Test
    void withId_returns_persisted_copy_keeping_other_fields() {
        var e = LogEvent.submit(ExecutionId.generate(), null, "INFO", "hi");

        var persisted = e.withId(42L);

        assertThat(persisted.id()).isEqualTo(42L);
        assertThat(persisted.isPersisted()).isTrue();
        assertThat(persisted.executionId()).isEqualTo(e.executionId());
        assertThat(persisted.level()).isEqualTo(e.level());
        assertThat(persisted.message()).isEqualTo(e.message());
        assertThat(persisted.loggedAt()).isEqualTo(e.loggedAt());
    }

    @Test
    void constructor_rejects_null_executionId() {
        assertThatThrownBy(() -> new LogEvent(0L, null, null, "INFO", "x", Instant.now()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("executionId");
    }

    @Test
    void constructor_rejects_blank_level() {
        assertThatThrownBy(() ->
                new LogEvent(0L, ExecutionId.generate(), null, "  ", "x", Instant.now()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("level");
    }

    @Test
    void constructor_rejects_null_message() {
        assertThatThrownBy(() ->
                new LogEvent(0L, ExecutionId.generate(), null, "INFO", null, Instant.now()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("message");
    }

    @Test
    void constructor_accepts_empty_message() {
        var e = new LogEvent(0L, ExecutionId.generate(), null, "INFO", "", Instant.now());
        assertThat(e.message()).isEmpty();
    }
}
