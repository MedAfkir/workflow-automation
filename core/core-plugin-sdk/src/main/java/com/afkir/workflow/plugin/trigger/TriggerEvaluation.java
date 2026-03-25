package com.afkir.workflow.plugin.trigger;

import java.time.Instant;
import java.util.Map;

public sealed interface TriggerEvaluation {

    record Fire(Map<String, Object> inputs, Instant nextEvaluation) implements TriggerEvaluation {
    }

    record Skip(Instant nextEvaluation) implements TriggerEvaluation {
    }

    record Error(String message) implements TriggerEvaluation {
    }
}
