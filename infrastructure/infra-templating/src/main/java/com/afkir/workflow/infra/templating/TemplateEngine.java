package com.afkir.workflow.infra.templating;

import io.pebbletemplates.pebble.PebbleEngine;
import io.pebbletemplates.pebble.error.PebbleException;
import io.pebbletemplates.pebble.loader.StringLoader;
import io.pebbletemplates.pebble.template.PebbleTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.StringWriter;
import java.util.Map;


public class TemplateEngine {

    private static final Logger log = LoggerFactory.getLogger(TemplateEngine.class);

    private final PebbleEngine pebble;

    public TemplateEngine() {
        this.pebble = new PebbleEngine.Builder()
                .loader(new StringLoader())
                .strictVariables(true)
                .autoEscaping(false)              
                .cacheActive(true)                
                .extension(new WorkflowTemplateExtension())
                .build();
    }

    
    public String resolve(String template, Map<String, Object> context) {
        if (template == null) return null;
        if (!containsExpression(template)) return template;  

        try {
            PebbleTemplate compiled = pebble.getTemplate(template);
            StringWriter writer = new StringWriter();
            compiled.evaluate(writer, context);
            return writer.toString();
        } catch (PebbleException e) {
            log.debug("Template resolution failed for: {}", template, e);
            throw new TemplateResolutionException(
                    "Failed to resolve template: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new TemplateResolutionException(
                    "Unexpected error resolving template", e);
        }
    }

    private boolean containsExpression(String s) {
        return s.contains("{{") || s.contains("{%");
    }

}