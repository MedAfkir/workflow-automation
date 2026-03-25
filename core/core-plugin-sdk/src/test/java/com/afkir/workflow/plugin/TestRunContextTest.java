package com.afkir.workflow.app.plugin;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class TestRunContextTest {

    record SampleInput(String message) {
    }

    @Test
    void provides_input_and_default_metadata() {
        var ctx = TestRunContext.builder(new SampleInput("hello")).build();

        assertThat(ctx.input().message()).isEqualTo("hello");
        assertThat(ctx.execution().workflowKey()).isEqualTo("test_workflow");
        assertThat(ctx.timeout()).isEqualTo(Duration.ofSeconds(30));
        assertThat(ctx.isCancelled()).isFalse();
    }

    @Test
    void captures_logger_messages() {
        var ctx = TestRunContext.builder(new SampleInput("hi")).build();
        ctx.logger().info("Starting");
        ctx.logger().warn("Item {} of {}", 1, 10);

        assertThat(ctx.capturedLogs())
                .containsExactly("[INFO] Starting", "[WARN] Item 1 of 10");
    }

    @Test
    void resolves_secrets() {
        var ctx = TestRunContext.builder(new SampleInput("x"))
                .withSecret("api_key", "shhh")
                .build();

        assertThat(ctx.secrets().resolve("api_key")).contains("shhh");
        assertThat(ctx.secrets().resolve("missing")).isEmpty();
    }

    @Test
    void exposes_previous_outputs_and_variables() {
        var ctx = TestRunContext.builder(new SampleInput("x"))
                .withPreviousOutput("fetch", Map.of("status", 200))
                .withVariable("env", "prod")
                .build();

        assertThat(ctx.previousOutputs().get("fetch")).isEqualTo(Map.of("status", 200));
        assertThat(ctx.variables().get("env")).isEqualTo("prod");
    }

    @Test
    void supports_cancellation() {
        var ctx = TestRunContext.builder(new SampleInput("x")).build();
        assertThat(ctx.isCancelled()).isFalse();
        ctx.cancel();
        assertThat(ctx.isCancelled()).isTrue();
    }

    @Test
    void idempotency_key_is_stable() {
        var ctx = TestRunContext.builder(new SampleInput("x")).build();
        var key1 = ctx.execution().idempotencyKey();
        var key2 = ctx.execution().idempotencyKey();
        assertThat(key1).isEqualTo(key2);
        assertThat(key1).contains(":1");
    }

}