package com.afkir.workflow.engine.templating;

import java.util.Map;

public interface TemplateRenderer {

    Map<String, Object> resolve(Map<String, Object> config, Map<String, Object> ctx);
}
