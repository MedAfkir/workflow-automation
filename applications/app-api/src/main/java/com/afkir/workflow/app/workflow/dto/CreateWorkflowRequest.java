package com.afkir.workflow.app.workflow.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateWorkflowRequest(
        @NotBlank String yaml
) {
}
