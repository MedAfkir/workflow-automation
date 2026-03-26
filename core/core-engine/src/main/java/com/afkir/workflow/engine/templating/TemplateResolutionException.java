package com.afkir.workflow.engine.templating;

public class TemplateResolutionException extends RuntimeException {

    public TemplateResolutionException(String message) {
        super(message);
    }

    public TemplateResolutionException(String message, Throwable cause) {
        super(message, cause);
    }
}
