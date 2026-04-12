package com.afkir.workflow.app.trigger;

import com.afkir.workflow.domain.trigger.TriggerRepository;
import com.afkir.workflow.domain.workflow.WorkflowId;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workflows/{workflowId}/triggers")
public class TriggerController {

    private final TriggerRepository repository;

    public TriggerController(TriggerRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<TriggerResponse> listTriggers(@PathVariable UUID workflowId) {
        return repository.findByWorkflowId(new WorkflowId(workflowId)).stream()
                .map(TriggerMapper::toResponse)
                .toList();
    }
}
