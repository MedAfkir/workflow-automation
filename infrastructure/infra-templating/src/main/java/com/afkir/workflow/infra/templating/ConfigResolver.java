package com.afkir.workflow.infra.templating;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;


public class ConfigResolver {

    private static final Logger log = LoggerFactory.getLogger(ConfigResolver.class);
    private static final int MAX_DEPTH = 50;

    private final TemplateEngine engine;

    public ConfigResolver(TemplateEngine engine) {
        this.engine = engine;
    }

    public Map<String, Object> resolve(Map<String, Object> config, Map<String, Object> ctx) {
        return resolveMap(config, ctx, 0);
    }

    @SuppressWarnings("unchecked")
    private Object resolveValue(Object value, Map<String, Object> ctx, int depth) {
        if (depth > MAX_DEPTH) {
            throw new TemplateResolutionException("Config nested too deeply (>" + MAX_DEPTH + ")");
        }
        if (value == null) return null;
        if (value instanceof String s) return engine.resolve(s, ctx);
        if (value instanceof Map<?, ?> m) return resolveMap((Map<String, Object>) m, ctx, depth + 1);
        if (value instanceof List<?> l) return resolveList((List<Object>) l, ctx, depth + 1);
        
        return value;
    }

    private Map<String, Object> resolveMap(Map<String, Object> map, Map<String, Object> ctx, int depth) {
        var result = new LinkedHashMap<String, Object>(map.size());
        for (var entry : map.entrySet()) {
            result.put(entry.getKey(), resolveValue(entry.getValue(), ctx, depth));
        }
        return result;
    }

    private List<Object> resolveList(List<Object> list, Map<String, Object> ctx, int depth) {
        var result = new ArrayList<>(list.size());
        for (var item : list) {
            result.add(resolveValue(item, ctx, depth));
        }
        return result;
    }

}