package com.afkir.workflow.infra.templating;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ConfigResolverTest {

    private final ConfigResolver resolver = new ConfigResolver(new TemplateEngine());

    @Test
    void resolves_string_values_in_map() {
        var config = Map.<String, Object>of(
                "url", "https://api.example.com/users/{{ inputs.id }}",
                "method", "GET"
        );
        var ctx = Map.<String, Object>of("inputs", Map.of("id", "42"));

        var resolved = resolver.resolve(config, ctx);

        assertThat(resolved.get("url")).isEqualTo("https://api.example.com/users/42");
        assertThat(resolved.get("method")).isEqualTo("GET");
    }

    @Test
    void resolves_nested_maps() {
        var config = Map.<String, Object>of(
                "headers", Map.of(
                        "Authorization", "Bearer {{ secrets.token }}",
                        "X-Trace-Id", "{{ execution.id }}"
                )
        );
        var ctx = Map.<String, Object>of(
                "secrets", Map.of("token", "abc123"),
                "execution", Map.of("id", "exec-1")
        );

        var resolved = resolver.resolve(config, ctx);
        @SuppressWarnings("unchecked")
        var headers = (Map<String, Object>) resolved.get("headers");

        assertThat(headers.get("Authorization")).isEqualTo("Bearer abc123");
        assertThat(headers.get("X-Trace-Id")).isEqualTo("exec-1");
    }

    @Test
    void resolves_lists() {
        var config = Map.<String, Object>of(
                "items", List.of("{{ vars.first }}", "{{ vars.second }}", "static")
        );
        var ctx = Map.<String, Object>of("vars", Map.of("first", "a", "second", "b"));

        var resolved = resolver.resolve(config, ctx);
        assertThat(resolved.get("items")).isEqualTo(List.of("a", "b", "static"));
    }

    @Test
    void preserves_non_string_values() {
        var config = Map.<String, Object>of(
                "count", 42,
                "active", true,
                "ratio", 0.5
        );
        var resolved = resolver.resolve(config, Map.of());
        assertThat(resolved).isEqualTo(config);
    }
}