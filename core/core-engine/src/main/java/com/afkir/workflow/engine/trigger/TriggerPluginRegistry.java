package com.afkir.workflow.engine.trigger;

import com.afkir.workflow.plugin.meta.Plugin;
import com.afkir.workflow.plugin.trigger.PolledTrigger;
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
public class TriggerPluginRegistry {

    private static final Logger log = LoggerFactory.getLogger(TriggerPluginRegistry.class);

    private final Map<String, RegisteredPolledTrigger> polled = new HashMap<>();

    @Autowired
    public TriggerPluginRegistry(List<PolledTrigger<?>> polledTriggers) {
        polledTriggers.forEach(this::registerPolled);
        log.info("TriggerPluginRegistry initialized with {} polled triggers", polled.size());
        polled.keySet().stream().sorted().forEach(id -> log.info("  - {}", id));
    }

    private void registerPolled(PolledTrigger<?> trigger) {
        var meta = readPluginAnnotation(trigger.getClass());
        var configType = resolveConfigType(trigger.getClass());
        if (polled.containsKey(meta.id())) {
            throw new IllegalStateException("Duplicate polled trigger id: " + meta.id());
        }
        polled.put(meta.id(), new RegisteredPolledTrigger(meta, trigger, configType));
    }

    private Plugin readPluginAnnotation(Class<?> clazz) {
        var ann = clazz.getAnnotation(Plugin.class);
        if (ann == null) {
            throw new IllegalStateException(
                    "Class " + clazz.getName() + " must be annotated with @Plugin");
        }
        return ann;
    }

    private Class<?> resolveConfigType(Class<?> triggerClass) {
        for (Type genericInterface : triggerClass.getGenericInterfaces()) {
            if (genericInterface instanceof ParameterizedType pt
                    && pt.getRawType() == PolledTrigger.class) {
                Type configType = pt.getActualTypeArguments()[0];
                if (configType instanceof Class<?> c) return c;
                if (configType instanceof ParameterizedType ptInput
                        && ptInput.getRawType() instanceof Class<?> c) return c;
            }
        }
        throw new IllegalStateException(
                "Cannot resolve config type for " + triggerClass.getName());
    }

    public boolean exists(String type) {
        return polled.containsKey(type);
    }

    public RegisteredPolledTrigger require(String type) {
        var trigger = polled.get(type);
        if (trigger == null) {
            throw new IllegalStateException("No polled trigger registered with id: " + type);
        }
        return trigger;
    }

    public Map<String, RegisteredPolledTrigger> all() {
        return Map.copyOf(polled);
    }

    public record RegisteredPolledTrigger(
            Plugin meta,
            PolledTrigger<?> instance,
            Class<?> configType
    ) {
    }
}
