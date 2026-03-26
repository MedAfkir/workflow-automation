package com.afkir.workflow.plugin.builtin.trigger;

import com.afkir.workflow.plugin.meta.Plugin;
import com.afkir.workflow.plugin.meta.PropertyDoc;

import java.util.Map;

@Plugin(
        id = "io.workflowplatform.builtin.Webhook",
        version = "1.0.0",
        description = "Fires the workflow when a POST request is made to the webhook URL",
        categories = {"trigger", "webhook"}
)
public class Webhook {

    public record Config(
            @PropertyDoc(description = "Optional secret to verify request signature (HMAC-SHA256 of body in 'X-Workflow-Signature' header)")
            String signatureSecret,
            @PropertyDoc(description = "Inputs are merged with the request payload (request takes precedence)")
            Map<String, Object> inputs
    ) {
    }
}
