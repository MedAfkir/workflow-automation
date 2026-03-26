package com.afkir.workflow.engine.execution;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public sealed interface StepResult {

    record Continue(Map<String, Object> outputs) implements StepResult {
    }

    record Spawn(List<ScheduledStep> children, Integer concurrency) implements StepResult {
        public Spawn(List<ScheduledStep> children) {
            this(children, null);
        }
    }

    record Wait(Instant until) implements StepResult {
    }

    record Fail(String code, String message) implements StepResult {
    }

    record Cancel() implements StepResult {
    }
}
