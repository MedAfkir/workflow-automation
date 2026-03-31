package com.afkir.workflow.infra.secrets.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RotateSecretRequest(
        @NotBlank
        @Size(max = 4096)
        String value
) {
}
