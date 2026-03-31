package com.afkir.workflow.infra.secrets.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateSecretRequest(
        @NotBlank
        @Pattern(regexp = "^[a-z0-9][a-z0-9_.-]{0,63}$",
                message = "namespace must match ^[a-z0-9][a-z0-9_.-]{0,63}$")
        String namespace,

        @NotBlank
        @Size(min = 1, max = 128)
        String key,

        @NotBlank
        @Size(max = 4096)
        String value
) {
}
