package com.afkir.workflow.engine.plugin;

import com.afkir.workflow.plugin.meta.Plugin;
import com.afkir.workflow.plugin.task.FlowableTask;
import com.afkir.workflow.plugin.task.RunnableTask;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.lang.reflect.ParameterizedType;
import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class PluginRegistry {

    private static final Logger log = LoggerFactory.getLogger(PluginRegistry.class);

    private final Map<String, RegisteredPlugin> byId = new HashMap<>();

    @Autowired
    public PluginRegistry(List<RunnableTask<?, ?>> runnables, List<FlowableTask<?>> flowables) {
        runnables.forEach(this::registerRunnable);
        flowables.forEach(this::registerFlowable);
        log.info("Plugin registry initialized with {} plugins", byId.size());
        byId.keySet().stream().sorted().forEach(id -> log.info("  - {}", id));
    }

    private void registerRunnable(RunnableTask<?, ?> task) {
        var meta = readPluginAnnotation(task.getClass());
        var inputType = resolveInputType(task.getClass(), RunnableTask.class);
        register(meta.id(), new RegisteredPlugin(meta, task, inputType, PluginKind.RUNNABLE));
    }

    private void registerFlowable(FlowableTask<?> task) {
        var meta = readPluginAnnotation(task.getClass());
        var inputType = resolveInputType(task.getClass(), FlowableTask.class);
        register(meta.id(), new RegisteredPlugin(meta, task, inputType, PluginKind.FLOWABLE));
    }

    private void register(String id, RegisteredPlugin plugin) {
        if (byId.containsKey(id)) {
            throw new IllegalStateException("Duplicate plugin id: " + id);
        }
        byId.put(id, plugin);
    }

    private Plugin readPluginAnnotation(Class<?> clazz) {
        var ann = clazz.getAnnotation(Plugin.class);
        if (ann == null) {
            throw new IllegalStateException(
                    "Class " + clazz.getName() + " must be annotated with @Plugin");
        }
        return ann;
    }

    
    private Class<?> resolveInputType(Class<?> taskClass, Class<?> interfaceClass) {
        for (Type genericInterface : taskClass.getGenericInterfaces()) {
            if (genericInterface instanceof ParameterizedType pt
                    && pt.getRawType() == interfaceClass) {
                Type inputType = pt.getActualTypeArguments()[0];
                if (inputType instanceof Class<?> c) return c;
                if (inputType instanceof ParameterizedType ptInput
                        && ptInput.getRawType() instanceof Class<?> c) return c;
            }
        }
        throw new IllegalStateException(
                "Cannot resolve input type for " + taskClass.getName());
    }

    public RegisteredPlugin require(String id) {
        var plugin = byId.get(id);
        if (plugin == null) {
            throw new PluginNotFoundException("No plugin registered with id: " + id);
        }
        return plugin;
    }

    public boolean exists(String id) {
        return byId.containsKey(id);
    }

    public Map<String, RegisteredPlugin> all() {
        return Map.copyOf(byId);
    }

    public enum PluginKind {RUNNABLE, FLOWABLE}

    public record RegisteredPlugin(
            Plugin meta,
            Object instance,
            Class<?> inputType,
            PluginKind kind
    ) {
    }

}