package com.afkir.workflow.api.info;

import java.time.Instant;

public record ProjectInfoResponse(
        String name,
        String version,
        String description,
        Instant buildTime,
        String environment,
        String group,
        String artifact
) {
}
