package com.afkir.workflow.app.workflow.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateWorkflowRequest(
        @NotBlank String yaml
) {
}
