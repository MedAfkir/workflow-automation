package com.afkir.workflow.app.execution.dto;

import jakarta.validation.constraints.NotNull;

import java.util.Map;
import java.util.UUID;

public record CreateExecutionRequest(
        @NotNull UUID workflowId,
        Map<String, Object> inputs
) {
}
