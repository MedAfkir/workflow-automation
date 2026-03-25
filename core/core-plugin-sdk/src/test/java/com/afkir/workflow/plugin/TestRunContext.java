package com.afkir.workflow.app.plugin;

import com.afkir.workflow.plugin.runtime.ExecutionInfo;
import com.afkir.workflow.plugin.runtime.PluginLogger;
import com.afkir.workflow.plugin.runtime.RunContext;
import com.afkir.workflow.plugin.runtime.SecretResolver;
import com.afkir.workflow.plugin.runtime.StorageAccess;

import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.*;


public class TestRunContext<I> implements RunContext<I> {

    private final I input;
    private final Map<String, String> secrets;
    private final Map<String, Object> previousOutputs;
    private final Map<String, Object> variables;
    private final Map<String, Object> workflowInputs;
    private final ExecutionInfo executionInfo;
    private final Duration timeout;
    private final TestPluginLogger logger;
    private final TestStorageAccess storage;
    private boolean cancelled = false;

    private TestRunContext(Builder<I> b) {
        this.input = Objects.requireNonNull(b.input);
        this.secrets = Map.copyOf(b.secrets);
        this.previousOutputs = Map.copyOf(b.previousOutputs);
        this.variables = Map.copyOf(b.variables);
        this.workflowInputs = Map.copyOf(b.workflowInputs);
        this.executionInfo = b.executionInfo;
        this.timeout = b.timeout;
        this.logger = new TestPluginLogger();
        this.storage = new TestStorageAccess();
    }

    public static <I> Builder<I> builder(I input) {
        return new Builder<>(input);
    }

    @Override
    public I input() {
        return input;
    }

    @Override
    public PluginLogger logger() {
        return logger;
    }

    @Override
    public SecretResolver secrets() {
        return key -> Optional.ofNullable(secrets.get(key));
    }

    @Override
    public StorageAccess storage() {
        return storage;
    }

    @Override
    public ExecutionInfo execution() {
        return executionInfo;
    }

    @Override
    public Duration timeout() {
        return timeout;
    }

    @Override
    public Map<String, Object> previousOutputs() {
        return previousOutputs;
    }

    @Override
    public Map<String, Object> variables() {
        return variables;
    }

    @Override
    public Map<String, Object> workflowInputs() {
        return workflowInputs;
    }

    @Override
    public boolean isCancelled() {
        return cancelled;
    }

    
    public List<String> capturedLogs() {
        return logger.messages();
    }

    public Map<URI, byte[]> storedArtifacts() {
        return storage.stored();
    }

    public void cancel() {
        this.cancelled = true;
    }

    public static class Builder<I> {
        private final I input;
        private Map<String, String> secrets = new HashMap<>();
        private Map<String, Object> previousOutputs = new HashMap<>();
        private Map<String, Object> variables = new HashMap<>();
        private Map<String, Object> workflowInputs = new HashMap<>();
        private ExecutionInfo executionInfo = defaultExecutionInfo();
        private Duration timeout = Duration.ofSeconds(30);

        private Builder(I input) {
            this.input = input;
        }

        public Builder<I> withSecret(String k, String v) {
            secrets.put(k, v);
            return this;
        }

        public Builder<I> withPreviousOutput(String taskId, Object output) {
            previousOutputs.put(taskId, output);
            return this;
        }

        public Builder<I> withVariable(String k, Object v) {
            variables.put(k, v);
            return this;
        }

        public Builder<I> withWorkflowInput(String k, Object v) {
            workflowInputs.put(k, v);
            return this;
        }

        public Builder<I> withExecutionInfo(ExecutionInfo info) {
            this.executionInfo = info;
            return this;
        }

        public Builder<I> withTimeout(Duration t) {
            this.timeout = t;
            return this;
        }

        public TestRunContext<I> build() {
            return new TestRunContext<>(this);
        }

        private static ExecutionInfo defaultExecutionInfo() {
            return new ExecutionInfo(
                    UUID.randomUUID(), UUID.randomUUID(),
                    "test", "test_workflow", 1,
                    "test_task", 1, Instant.now()
            );
        }
    }

}