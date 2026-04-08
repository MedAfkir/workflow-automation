package com.afkir.workflow.app.workflow;

import com.afkir.workflow.app.workflow.dto.*;
import com.afkir.workflow.domain.workflow.WorkflowId;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workflows")
public class WorkflowController {

    private final WorkflowService service;

    public WorkflowController(WorkflowService service) {
        this.service = service;
    }

    @PostMapping(consumes = {"application/json", "application/x-yaml", "text/yaml"})
    public ResponseEntity<WorkflowDetailResponse> create(
            @Valid @RequestBody CreateWorkflowRequest request) {
        var result = service.create(request.yaml());
        var response = toDetailResponse(result);
        return ResponseEntity
                .created(URI.create("/api/v1/workflows/" + result.workflow().id()))
                .body(response);
    }

    @PutMapping("/{id}")
    public WorkflowDetailResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateWorkflowRequest request) {
        var result = service.update(new WorkflowId(id), request.yaml());
        return toDetailResponse(result);
    }

    @GetMapping("/{id}")
    public WorkflowDetailResponse findById(@PathVariable UUID id) {
        var result = service.findById(new WorkflowId(id));
        return toDetailResponse(result);
    }

    @GetMapping("/{id}/revisions")
    public List<RevisionResponse> listRevisions(@PathVariable UUID id) {
        return service.listRevisions(new WorkflowId(id)).stream()
                .map(r -> new RevisionResponse(r.id(), r.revision(), r.hash(), r.createdAt()))
                .toList();
    }

    private WorkflowDetailResponse toDetailResponse(WorkflowService.WorkflowWithRevision wr) {
        return new WorkflowDetailResponse(
                wr.workflow().id().value(),
                wr.workflow().namespaceKey().namespace(),
                wr.workflow().namespaceKey().key(),
                wr.workflow().enabled(),
                wr.revision().revision(),
                wr.revision().sourceYaml(),
                wr.workflow().createdAt(),
                wr.workflow().updatedAt()
        );
    }
}