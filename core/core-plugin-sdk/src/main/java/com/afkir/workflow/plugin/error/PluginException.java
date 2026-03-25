package com.afkir.workflow.plugin.error;


public abstract class PluginException extends RuntimeException {
    private final String errorCode;

    protected PluginException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    protected PluginException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String errorCode() {
        return errorCode;
    }

    public abstract boolean retryable();

}