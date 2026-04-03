package com.afkir.workflow.infra.templating;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TemplateEngineTest {

    private final TemplateEngine engine = new TemplateEngine();

    @Test
    void passes_through_strings_without_expressions() {
        assertThat(engine.resolve("hello world", Map.of())).isEqualTo("hello world");
    }

    @Test
    void resolves_simple_variable() {
        var ctx = Map.<String, Object>of("name", "Alice");
        assertThat(engine.resolve("Hello {{ name }}!", ctx)).isEqualTo("Hello Alice!");
    }

    @Test
    void resolves_nested_access() {
        var ctx = Map.<String, Object>of(
                "outputs", Map.of("fetch", Map.of("status", 200))
        );
        assertThat(engine.resolve("status={{ outputs.fetch.status }}", ctx))
                .isEqualTo("status=200");
    }

    @Test
    void supports_default_filter() {
        var ctx = Map.<String, Object>of();
        assertThat(engine.resolve("{{ missing | default('fallback') }}", ctx))
                .isEqualTo("fallback");
    }

    @Test
    void supports_json_filter() {
        var ctx = Map.<String, Object>of("data", Map.of("a", 1, "b", "two"));
        var resolved = engine.resolve("{{ data | json }}", ctx);
        assertThat(resolved).contains("\"a\":1").contains("\"b\":\"two\"");
    }

    @Test
    void throws_on_undefined_variable_in_strict_mode() {
        assertThatThrownBy(() -> engine.resolve("{{ undefined_var }}", Map.of()))
                .isInstanceOf(TemplateResolutionException.class);
    }

    @Test
    void supports_conditional_expression() {
        var ctx = Map.<String, Object>of("status", 200);
        assertThat(engine.resolve("{{ status == 200 ? 'OK' : 'KO' }}", ctx)).isEqualTo("OK");
    }

    @Test
    void supports_arithmetic() {
        var ctx = Map.<String, Object>of("a", 5, "b", 3);
        assertThat(engine.resolve("{{ a + b }}", ctx)).isEqualTo("8");
    }

}