package com.afkir.workflow.domain.workflow;

public record Concurrency(Integer max) {

    public static final Concurrency UNLIMITED = new Concurrency(null);

    public Concurrency {
        if (max != null && max < 1) {
            throw new IllegalArgumentException("concurrency.max must be >= 1 (got " + max + ")");
        }
    }
}
