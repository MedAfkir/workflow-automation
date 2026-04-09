package com.afkir.workflow.app.execution;

import com.afkir.workflow.app.execution.dto.CreateExecutionRequest;
import com.afkir.workflow.app.execution.dto.ExecutionDetailResponse;
import com.afkir.workflow.app.execution.dto.ExecutionResponse;
import com.afkir.workflow.app.execution.dto.ExecutionSummaryResponse;
import com.afkir.workflow.domain.execution.Execution;
import com.afkir.workflow.domain.execution.ExecutionId;
import com.afkir.workflow.domain.execution.ExecutionState;
import com.afkir.workflow.domain.workflow.WorkflowId;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/executions")
public class ExecutionController {

    private static final int LIST_MAX_LIMIT = 200;
    
    private static final int LIST_DEFAULT_LIMIT = 50;

    private final ExecutionService service;

    public ExecutionController(ExecutionService service) {
        this.service = service;
    }

    @GetMapping
    public List<ExecutionSummaryResponse> list(
            @RequestParam(value = "limit", required = false) Integer limit,
            @RequestParam(value = "state", required = false) String state) {
        int effective = Math.min(
                limit == null || limit < 1 ? LIST_DEFAULT_LIMIT : limit,
                LIST_MAX_LIMIT);
        ExecutionState filter = state == null || state.isBlank()
                ? null
                : ExecutionState.valueOf(state.toUpperCase());

        return service.findRecent(effective, filter).stream()
                .map(c -> ExecutionMapper.toSummary(c.execution(), c.workflow(), c.revision()))
                .toList();
    }

    @PostMapping
    public ResponseEntity<ExecutionResponse> create(
            @Valid @RequestBody CreateExecutionRequest req,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {

        Execution exec;
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            exec = service.createIdempotent(
                    new WorkflowId(req.workflowId()),
                    req.inputs() == null ? Map.of() : req.inputs(),
                    idempotencyKey
            );
        } else {
            exec = service.createAndExecute(
                    new WorkflowId(req.workflowId()),
                    req.inputs() == null ? Map.of() : req.inputs()
            );
        }

        var ctx = service.findContext(exec.id());
        var response = ExecutionMapper.toResponse(ctx.execution(), ctx.workflow(), ctx.revision());
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .header("Location", "/api/v1/executions/" + exec.id())
                .body(response);
    }

    @GetMapping("/{id}")
    public ExecutionDetailResponse findById(@PathVariable UUID id) {
        var ctx = service.findContext(new ExecutionId(id));
        var taskRuns = service.findTaskRuns(ctx.execution().id());
        return ExecutionMapper.toDetail(
                ctx.execution(), taskRuns, ctx.workflow(), ctx.revision());
    }

    @PostMapping("/{id}/kill")
    public ResponseEntity<ExecutionResponse> kill(@PathVariable UUID id) {
        service.kill(new ExecutionId(id));
        var ctx = service.findContext(new ExecutionId(id));
        return ResponseEntity.ok(
                ExecutionMapper.toResponse(ctx.execution(), ctx.workflow(), ctx.revision()));
    }
}
