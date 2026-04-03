package com.afkir.workflow.infra.yaml;

import com.afkir.workflow.domain.namespace.NamespaceKey;
import com.afkir.workflow.domain.task.ErrorHandling;
import com.afkir.workflow.domain.task.RetryPolicy;
import com.afkir.workflow.domain.task.TaskDefinition;
import com.afkir.workflow.domain.task.TaskId;
import com.afkir.workflow.domain.workflow.Concurrency;
import com.afkir.workflow.domain.workflow.WorkflowDefinition;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.dataformat.yaml.YAMLMapper;

import java.util.List;
import java.util.Map;

@Component
public class WorkflowYamlParser {

    private final ObjectMapper yamlMapper;

    public WorkflowYamlParser() {
        
        this.yamlMapper = YAMLMapper.builder().build();
    }

    public WorkflowDefinition parse(String yaml) {
        if (yaml == null || yaml.isBlank()) {
            throw new YamlParsingException("YAML content is empty");
        }

        WorkflowYamlDto dto;
        try {
            dto = yamlMapper.readValue(yaml, WorkflowYamlDto.class);
        } catch (Exception e) {
            throw new YamlParsingException("Cannot parse YAML: " + e.getMessage(), e);
        }

        if (dto.namespace() == null || dto.key() == null) {
            throw new YamlParsingException("namespace and key are required");
        }

        var namespaceKey = new NamespaceKey(dto.namespace(), dto.key());
        var tasks = toTaskDefinitions(dto.tasks());
        var triggers = toTaskDefinitions(dto.triggers());
        var errors = toTaskDefinitions(dto.errors());

        try {
            return new WorkflowDefinition(
                    namespaceKey,
                    dto.description(),
                    dto.inputs() == null ? Map.of() : dto.inputs(),
                    dto.variables() == null ? Map.of() : dto.variables(),
                    tasks,
                    triggers,
                    errors,
                    parseErrorHandling(dto.errorHandling()),
                    dto.concurrency() == null
                            ? Concurrency.UNLIMITED
                            : new Concurrency(dto.concurrency().max())
            );
        } catch (IllegalArgumentException e) {
            throw new YamlParsingException(e.getMessage(), e);
        }
    }

    private static ErrorHandling parseErrorHandling(String raw) {
        if (raw == null || raw.isBlank()) return ErrorHandling.FAIL_FAST;
        
        String normalized = raw.trim().toUpperCase().replace('-', '_');
        try {
            return ErrorHandling.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            throw new YamlParsingException(
                    "Invalid errorHandling: '" + raw + "' (expected fail-fast or continue)");
        }
    }

    private List<TaskDefinition> toTaskDefinitions(List<TaskYamlDto> source) {
        if (source == null) return List.of();
        return source.stream().map(this::toTaskDefinition).toList();
    }

    private TaskDefinition toTaskDefinition(TaskYamlDto t) {
        if (t.id() == null || t.type() == null) {
            throw new YamlParsingException("Task id and type are required");
        }
        
        List<TaskId> deps = t.dependsOn() == null
                ? null
                : t.dependsOn().stream().map(TaskId::new).toList();
        return new TaskDefinition(
                new TaskId(t.id()),
                t.type(),
                t.config() == null ? Map.of() : t.config(),
                t.retry() == null ? null : t.retry().toDomain(),
                t.timeout(),
                deps,
                parseTaskErrorOverride(t.onError()),
                t.allowFailure() != null && t.allowFailure()
        );
    }

    private static ErrorHandling parseTaskErrorOverride(String raw) {
        if (raw == null || raw.isBlank()) return null;
        return parseErrorHandling(raw);
    }

    public record WorkflowYamlDto(
            String namespace,
            String key,
            String description,
            @JsonProperty("errorHandling") String errorHandling,
            ConcurrencyYamlDto concurrency,
            Map<String, Object> inputs,
            Map<String, Object> variables,
            List<TaskYamlDto> tasks,
            List<TaskYamlDto> triggers,
            List<TaskYamlDto> errors
    ) {
    }

    public record ConcurrencyYamlDto(Integer max) {
    }

    public record TaskYamlDto(
            String id,
            String type,
            Map<String, Object> config,
            RetryYamlDto retry,
            String timeout,
            @JsonProperty("dependsOn") List<String> dependsOn,
            @JsonProperty("onError") String onError,
            @JsonProperty("allowFailure") Boolean allowFailure
    ) {
    }

    public record RetryYamlDto(
            @JsonProperty("maxAttempts") Integer maxAttempts,
            String backoff,
            @JsonProperty("initialDelay") String initialDelay,
            @JsonProperty("maxDelay") String maxDelay,
            Double jitter
    ) {
        public RetryPolicy toDomain() {
            return new RetryPolicy(
                    backoff == null ? RetryPolicy.BackoffType.CONSTANT
                            : RetryPolicy.BackoffType.valueOf(backoff.toUpperCase()),
                    initialDelay == null ? "PT1S" : initialDelay,
                    maxDelay == null ? "PT5M" : maxDelay,
                    maxAttempts == null ? 1 : maxAttempts,
                    jitter == null ? 0.0 : jitter
            );
        }
    }
}
