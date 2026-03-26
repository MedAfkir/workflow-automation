package com.afkir.workflow.engine.runtime;

import com.afkir.workflow.engine.log.LogSink;
import com.afkir.workflow.domain.execution.ExecutionId;
import com.afkir.workflow.domain.log.LogEvent;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class EngineLoggerTest {

    @Test
    void forExecution_emits_to_sink_with_executionId_and_taskRunId() {
        var captured = new ArrayList<LogEvent>();
        LogSink sink = captured::add;
        var execId = ExecutionId.generate();
        var taskRunId = UUID.randomUUID();

        var logger = EngineLogger.forExecution(execId, taskRunId, "greet", sink);

        logger.info("hello");
        logger.warn("watch out");
        logger.error("oh no");

        assertThat(captured).hasSize(3);
        assertThat(captured).allSatisfy(e -> {
            assertThat(e.executionId()).isEqualTo(execId);
            assertThat(e.taskRunId()).isEqualTo(taskRunId);
            assertThat(e.id()).isZero();   
        });
        assertThat(captured.get(0).level()).isEqualTo("INFO");
        assertThat(captured.get(0).message()).isEqualTo("hello");
        assertThat(captured.get(1).level()).isEqualTo("WARN");
        assertThat(captured.get(2).level()).isEqualTo("ERROR");
    }

    @Test
    void forExecution_with_null_taskRunId_still_emits() {
        var captured = new ArrayList<LogEvent>();
        var logger = EngineLogger.forExecution(
                ExecutionId.generate(), null, "exec-level", captured::add);

        logger.info("execution-level message");

        assertThat(captured).hasSize(1);
        assertThat(captured.get(0).taskRunId()).isNull();
    }

    @Test
    void forExecution_resolves_message_format_arguments() {
        var captured = new ArrayList<LogEvent>();
        var logger = EngineLogger.forExecution(
                ExecutionId.generate(), null, "fmt", captured::add);

        logger.info("item {} of {}", 3, 10);
        logger.warn("temperature {}C", 38);

        assertThat(captured).extracting(LogEvent::message)
                .containsExactly("item 3 of 10", "temperature 38C");
    }

    @Test
    void forTrigger_does_not_emit_to_any_sink() {
        
        var logger = EngineLogger.forTrigger("schedule:nightly");

        logger.info("evaluating cron");
        logger.warn("skipping past run");
        logger.error("evaluation failed");
    }

    @Test
    void sink_failure_does_not_crash_the_caller() {
        LogSink throwingSink = e -> { throw new RuntimeException("disk full"); };
        var logger = EngineLogger.forExecution(
                ExecutionId.generate(), null, "resilience", throwingSink);

        logger.info("this should not propagate the sink exception");
        logger.warn("nor this");
    }

    @Test
    void error_with_throwable_includes_exception_summary_in_sink_message() {
        var captured = new ArrayList<LogEvent>();
        var logger = EngineLogger.forExecution(
                ExecutionId.generate(), null, "ex", captured::add);

        logger.error("task crashed", new IllegalStateException("kaboom"));

        assertThat(captured).hasSize(1);
        assertThat(captured.get(0).level()).isEqualTo("ERROR");
        assertThat(captured.get(0).message())
                .contains("task crashed")
                .contains("IllegalStateException")
                .contains("kaboom");
    }
}
