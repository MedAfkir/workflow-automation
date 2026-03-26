package com.afkir.workflow.engine.execution;

import java.time.Instant;

public class WaitRequestedException extends RuntimeException {

    private final Instant waitUntil;

    public WaitRequestedException(Instant waitUntil) {
        super("Wait requested until " + waitUntil);
        this.waitUntil = waitUntil;
    }

    public Instant waitUntil() {
        return waitUntil;
    }
}
