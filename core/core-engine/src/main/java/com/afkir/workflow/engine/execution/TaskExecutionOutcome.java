package com.afkir.workflow.engine.execution;

import java.util.Map;

public sealed interface TaskExecutionOutcome {

    record Success(Map<String, Object> outputs, Map<String, Object> resolvedInputs)
            implements TaskExecutionOutcome {
    }

    record Failure(String errorCode, String errorMessage,
                   Map<String, Object> resolvedInputs, boolean retryable)
            implements TaskExecutionOutcome {
    }

    static TaskExecutionOutcome success(Map<String, Object> outputs, Map<String, Object> inputs) {
        return new Success(outputs == null ? Map.of() : outputs,
                inputs == null ? Map.of() : inputs);
    }

    static TaskExecutionOutcome retryableFailure(String code, String msg, Map<String, Object> inputs) {
        return new Failure(code, msg, inputs == null ? Map.of() : inputs, true);
    }

    static TaskExecutionOutcome permanentFailure(String code, String msg, Map<String, Object> inputs) {
        return new Failure(code, msg, inputs == null ? Map.of() : inputs, false);
    }

}
