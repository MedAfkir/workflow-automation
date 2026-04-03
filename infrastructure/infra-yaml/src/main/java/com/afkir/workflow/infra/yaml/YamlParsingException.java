package com.afkir.workflow.infra.yaml;

public class YamlParsingException extends RuntimeException {

    public YamlParsingException(String message) {
        super(message);
    }

    public YamlParsingException(String message, Throwable cause) {
        super(message, cause);
    }
}
