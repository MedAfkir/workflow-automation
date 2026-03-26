package com.afkir.workflow.engine.runtime;

import com.afkir.workflow.plugin.runtime.*;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;

public class RunContextImpl<I> implements RunContext<I> {

    private final I input;
    private final PluginLogger logger;
    private final SecretResolver secrets;
    private final StorageAccess storage;
    private final ExecutionInfo info;
    private final Duration timeout;
    private final Map<String, Object> previousOutputs;
    private final Map<String, Object> variables;
    private final Map<String, Object> workflowInputs;
    private final CancellationToken cancellation;

    public RunContextImpl(I input, PluginLogger logger,
                          SecretResolver secrets, StorageAccess storage,
                          ExecutionInfo info, Duration timeout,
                          Map<String, Object> previousOutputs,
                          Map<String, Object> variables,
                          Map<String, Object> workflowInputs,
                          CancellationToken cancellation) {
        this.input = input;
        this.logger = logger;
        this.secrets = secrets;
        this.storage = storage;
        this.info = info;
        this.timeout = timeout;
        this.previousOutputs = Map.copyOf(previousOutputs);
        this.variables = Map.copyOf(variables);
        this.workflowInputs = Map.copyOf(workflowInputs);
        this.cancellation = cancellation;
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
        return secrets;
    }

    @Override
    public StorageAccess storage() {
        return storage;
    }

    @Override
    public ExecutionInfo execution() {
        return info;
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
        return cancellation.isCancelled();
    }

    
    public static SecretResolver noopSecrets() {
        return key -> Optional.empty();
    }

    
    public static StorageAccess noopStorage() {
        return new StorageAccess() {
            @Override
            public java.net.URI put(String f, java.io.InputStream c) {
                throw new UnsupportedOperationException("Storage not yet implemented");
            }

            @Override
            public java.io.InputStream get(java.net.URI uri) {
                throw new UnsupportedOperationException("Storage not yet implemented");
            }

            @Override
            public boolean exists(java.net.URI uri) {
                return false;
            }
        };
    }
}