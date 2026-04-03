package com.afkir.workflow.infra.templating;

import io.pebbletemplates.pebble.extension.AbstractExtension;
import io.pebbletemplates.pebble.extension.Filter;
import io.pebbletemplates.pebble.template.EvaluationContext;
import io.pebbletemplates.pebble.template.PebbleTemplate;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.Map;

class WorkflowTemplateExtension extends AbstractExtension {

    
    
    private static final JsonMapper JSON = JsonMapper.builder().build();

    @Override
    public Map<String, Filter> getFilters() {
        return Map.of(
                "json", new JsonFilter(),
                "toString", new ToStringFilter()
        );
    }

    
    static class JsonFilter implements Filter {
        @Override
        public List<String> getArgumentNames() {
            return List.of();
        }

        @Override
        public Object apply(Object input, Map<String, Object> args,
                            PebbleTemplate self, EvaluationContext context, int lineNumber) {
            if (input == null) return "null";
            try {
                return JSON.writeValueAsString(input);
            } catch (Exception e) {
                throw new RuntimeException("Cannot serialize to JSON", e);
            }
        }
    }

    
    static class ToStringFilter implements Filter {
        @Override
        public List<String> getArgumentNames() {
            return List.of();
        }

        @Override
        public Object apply(Object input, Map<String, Object> args,
                            PebbleTemplate self, EvaluationContext context, int lineNumber) {
            return input == null ? "" : input.toString();
        }
    }

}