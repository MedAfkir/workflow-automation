package com.afkir.workflow.infra.templating;

import com.afkir.workflow.engine.templating.TemplateRenderer;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class PebbleTemplateRenderer implements TemplateRenderer {

    private final ConfigResolver delegate;

    public PebbleTemplateRenderer(ConfigResolver delegate) {
        this.delegate = delegate;
    }

    @Override
    public Map<String, Object> resolve(Map<String, Object> config, Map<String, Object> ctx) {
        try {
            return delegate.resolve(config, ctx);
        } catch (TemplateResolutionException e) {
            
            throw new com.afkir.workflow.engine.templating.TemplateResolutionException(
                    e.getMessage(), e);
        }
    }
}
