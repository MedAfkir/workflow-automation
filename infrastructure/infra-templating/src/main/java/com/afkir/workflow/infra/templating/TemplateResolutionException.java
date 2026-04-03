package com.afkir.workflow.infra.templating;

public class TemplateResolutionException extends RuntimeException {

    public TemplateResolutionException(String message) {
        super(message);
    }

    public TemplateResolutionException(String message, Throwable cause) {
        super(message, cause);
    }

}