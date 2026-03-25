package com.afkir.workflow.plugin.error;


public class NonRetryableException extends PluginException {

    public NonRetryableException(String errorCode, String message) {
        super(errorCode, message);
    }

    public NonRetryableException(String errorCode, String message, Throwable cause) {
        super(errorCode, message, cause);
    }

    @Override
    public boolean retryable() {
        return false;
    }

}