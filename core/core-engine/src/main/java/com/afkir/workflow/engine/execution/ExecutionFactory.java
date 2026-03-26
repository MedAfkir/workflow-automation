package com.afkir.workflow.engine.execution;

import com.afkir.workflow.domain.execution.Execution;
import com.afkir.workflow.domain.trigger.Trigger;
import com.afkir.workflow.domain.workflow.Workflow;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Component
public class ExecutionFactory {

    public Execution fromManual(Workflow workflow, Map<String, Object> inputs) {
        return Execution.create(
                workflow.id(),
                workflow.currentRevisionId(),
                "MANUAL",
                null,
                inputs == null ? Map.of() : inputs
        );
    }

    public Execution fromSchedule(Trigger trigger, Map<String, Object> inputs) {
        return Execution.create(
                trigger.workflowId(),
                trigger.workflowRevisionId(),
                "SCHEDULE",
                trigger.id(),
                inputs == null ? Map.of() : inputs
        );
    }

    public Execution fromWebhook(Trigger trigger,
                                 Map<String, Object> payload,
                                 Map<String, String> headers) {
        var combined = new HashMap<String, Object>();
        @SuppressWarnings("unchecked")
        var staticInputs = (Map<String, Object>)
                trigger.config().getOrDefault("inputs", Map.of());
        combined.putAll(staticInputs);
        if (payload != null) combined.put("payload", payload);
        if (headers != null && !headers.isEmpty()) combined.put("headers", headers);
        combined.put("receivedAt", Instant.now().toString());

        return Execution.create(
                trigger.workflowId(),
                trigger.workflowRevisionId(),
                "WEBHOOK",
                trigger.id(),
                combined
        );
    }
}
