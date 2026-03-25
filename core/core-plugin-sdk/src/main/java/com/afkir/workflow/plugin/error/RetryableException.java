package com.afkir.workflow.plugin.error;


public class RetryableException extends PluginException {

    public RetryableException(String errorCode, String message) {
        super(errorCode, message);
    }

    public RetryableException(String errorCode, String message, Throwable cause) {
        super(errorCode, message, cause);
    }

    @Override
    public boolean retryable() {
        return true;
    }

}