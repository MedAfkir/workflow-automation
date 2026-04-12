package com.afkir.workflow.app.trigger;

public class TriggerNotFoundException extends RuntimeException {

    public TriggerNotFoundException(String webhookKey) {
        super("Trigger not found for webhook key: " + webhookKey);
    }
}
