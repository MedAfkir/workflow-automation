package com.afkir.workflow.domain.task;

public record TaskId(String value) {

    private static final String VALID_PATTERN = "^[a-z][a-z0-9_]{0,63}$";

    public TaskId {
        if (value == null || !value.matches(VALID_PATTERN)) {
            throw new IllegalArgumentException(
                    "Task id must match " + VALID_PATTERN + ", got: " + value);
        }
    }

}