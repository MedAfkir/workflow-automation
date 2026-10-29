package com.afkir.workflow.plugin.builtin;

import com.afkir.workflow.plugin.runtime.ExecutionInfo;
import com.afkir.workflow.plugin.runtime.PluginLogger;
import com.afkir.workflow.plugin.runtime.RunContext;
import com.afkir.workflow.plugin.runtime.SecretResolver;
import com.afkir.workflow.plugin.runtime.StorageAccess;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class FakeRunContext<I> implements RunContext<I> {

    private final I input;
    private final Map<String, String> secrets = new HashMap<>();
    private final List<String> logs = new ArrayList<>();
    private Duration timeout = Duration.ofSeconds(30);
    private boolean cancelled = false;

    public FakeRunContext(I input) {
        this.input = input;
    }

    public FakeRunContext<I> withTimeout(Duration timeout) {
        this.timeout = timeout;
        return this;
    }

    public FakeRunContext<I> withSecret(String key, String value) {
        secrets.put(key, value);
        return this;
    }

    public FakeRunContext<I> cancel() {
        this.cancelled = true;
        return this;
    }

    public List<String> logs() {
        return logs;
    }

    @Override
    public I input() {
        return input;
    }

    @Override
    public PluginLogger logger() {
        return new PluginLogger() {
            @Override public void trace(String message) { logs.add(message); }
            @Override public void debug(String message) { logs.add(message); }
            @Override public void info(String message) { logs.add(message); }
            @Override public void warn(String message) { logs.add(message); }
            @Override public void error(String message) { logs.add(message); }
            @Override public void error(String message, Throwable cause) { logs.add(message); }
            @Override public void info(String format, Object... args) { logs.add(format(format, args)); }
            @Override public void warn(String format, Object... args) { logs.add(format(format, args)); }
            @Override public void error(String format, Object... args) { logs.add(format(format, args)); }
        };
    }

    @Override
    public SecretResolver secrets() {
        return key -> Optional.ofNullable(secrets.get(key));
    }

    @Override
    public StorageAccess storage() {
        return null;
    }

    @Override
    public ExecutionInfo execution() {
        return null;
    }

    @Override
    public Duration timeout() {
        return timeout;
    }

    @Override
    public Map<String, Object> previousOutputs() {
        return Map.of();
    }

    @Override
    public Map<String, Object> variables() {
        return Map.of();
    }

    @Override
    public Map<String, Object> workflowInputs() {
        return Map.of();
    }

    @Override
    public boolean isCancelled() {
        return cancelled;
    }

    private static String format(String format, Object... args) {
        var out = format;
        for (var arg : args) {
            out = out.replaceFirst("\\{}", java.util.regex.Matcher.quoteReplacement(String.valueOf(arg)));
        }
        return out;
    }
}
