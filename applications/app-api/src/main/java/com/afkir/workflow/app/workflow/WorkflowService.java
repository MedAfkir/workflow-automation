package com.afkir.workflow.app.workflow;

import com.afkir.workflow.domain.workflow.*;
import com.afkir.workflow.infra.yaml.WorkflowYamlParser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class WorkflowService {
    
    private final WorkflowRepository repository;
    private final WorkflowYamlParser parser;
    
    public WorkflowService(WorkflowRepository repository, WorkflowYamlParser parser) {
        this.repository = repository;
        this.parser = parser;
    }
    
    @Transactional
    public WorkflowWithRevision create(String yaml) {
        var definition = parser.parse(yaml);
        
        repository.findByNamespaceKey(definition.namespaceKey()).ifPresent(w -> {
            throw new WorkflowAlreadyExistsException(definition.namespaceKey());
        });
        
        var workflowId = WorkflowId.generate();
        var revisionId = UUID.randomUUID();
        var hash = sha256(yaml);
        
        var revision = new WorkflowRevision(
            revisionId, workflowId, 1, yaml, definition, hash, Instant.now()
        );
        var savedRevision = repository.saveRevision(revision);
        
        var workflow = new Workflow(
            workflowId,
            definition.namespaceKey(),
            revisionId,
            true,
            Instant.now(),
            Instant.now()
        );
        var savedWorkflow = repository.save(workflow);
        
        return new WorkflowWithRevision(savedWorkflow, savedRevision);
    }
    
    @Transactional
    public WorkflowWithRevision update(WorkflowId id, String yaml) {
        var workflow = repository.findById(id)
            .orElseThrow(() -> new WorkflowNotFoundException(id));
        
        var definition = parser.parse(yaml);
        
        if (!definition.namespaceKey().equals(workflow.namespaceKey())) {
            throw new IllegalArgumentException(
                "Cannot change namespace/key in update. Expected: " 
                + workflow.namespaceKey().fullName() 
                + ", got: " + definition.namespaceKey().fullName()
            );
        }
        
        var nextRevision = repository.nextRevisionNumber(id);
        var revisionId = UUID.randomUUID();
        var hash = sha256(yaml);
        
        var revision = new WorkflowRevision(
            revisionId, id, nextRevision, yaml, definition, hash, Instant.now()
        );
        var savedRevision = repository.saveRevision(revision);
        
        var updatedWorkflow = new Workflow(
            workflow.id(),
            workflow.namespaceKey(),
            revisionId,
            workflow.enabled(),
            workflow.createdAt(),
            Instant.now()
        );
        var savedWorkflow = repository.save(updatedWorkflow);
        
        return new WorkflowWithRevision(savedWorkflow, savedRevision);
    }

    @Transactional(readOnly = true)
    public WorkflowWithRevision findById(WorkflowId id) {
        var workflow = repository.findById(id)
            .orElseThrow(() -> new WorkflowNotFoundException(id));
        var revision = repository.findRevisionById(workflow.currentRevisionId())
            .orElseThrow(() -> new IllegalStateException("Revision missing for workflow " + id));
        return new WorkflowWithRevision(workflow, revision);
    }
    
    @Transactional(readOnly = true)
    public java.util.List<WorkflowRevision> listRevisions(WorkflowId id) {
        repository.findById(id).orElseThrow(() -> new WorkflowNotFoundException(id));
        return repository.findRevisions(id);
    }
    
    private static String sha256(String input) {
        try {
            var md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(input.getBytes()));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
    
    public record WorkflowWithRevision(Workflow workflow, WorkflowRevision revision) {}
}
