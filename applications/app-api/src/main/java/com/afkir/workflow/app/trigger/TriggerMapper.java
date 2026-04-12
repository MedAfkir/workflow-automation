package com.afkir.workflow.app.trigger;

import com.afkir.workflow.domain.trigger.Trigger;

public final class TriggerMapper {

    private TriggerMapper() {
    }

    public static TriggerResponse toResponse(Trigger t) {
        var webhookUrl = t.webhookKey() != null
                ? "/api/v1/triggers/webhook/" + t.webhookKey()
                : null;
        return new TriggerResponse(
                t.id(), t.triggerId(), t.type(), t.enabled(),
                t.nextEvaluationAt(), webhookUrl, t.errorMessage()
        );
    }
}
