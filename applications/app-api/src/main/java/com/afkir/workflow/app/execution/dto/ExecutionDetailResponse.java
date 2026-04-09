package com.afkir.workflow.app.execution.dto;

import java.util.List;

public record ExecutionDetailResponse(
        ExecutionResponse execution,
        List<TaskRunResponse> taskRuns
) {
}
