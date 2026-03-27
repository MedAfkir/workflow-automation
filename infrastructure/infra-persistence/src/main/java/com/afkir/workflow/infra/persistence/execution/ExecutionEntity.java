package com.afkir.workflow.infra.persistence.execution;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import tools.jackson.databind.JsonNode;
import jakarta.persistence.*;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "execution")
public class ExecutionEntity {

    @Id
    private UUID id;

    @Column(name = "workflow_id", nullable = false)
    private UUID workflowId;

    @Column(name = "workflow_revision_id", nullable = false)
    private UUID workflowRevisionId;

    @Column(nullable = false, length = 32)
    private String state;

    @Column(name = "trigger_type", nullable = false, length = 32)
    private String triggerType;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private JsonNode inputs;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    private JsonNode outputs;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "trigger_id")
    private UUID triggerId;

    @Column(name = "wait_until")
    private Instant waitUntil;

    @Column(name = "leased_by", length = 128)
    private String leasedBy;

    @Column(name = "leased_until")
    private Instant leasedUntil;

    protected ExecutionEntity() {
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getWorkflowId() { return workflowId; }
    public void setWorkflowId(UUID workflowId) { this.workflowId = workflowId; }

    public UUID getWorkflowRevisionId() { return workflowRevisionId; }
    public void setWorkflowRevisionId(UUID workflowRevisionId) { this.workflowRevisionId = workflowRevisionId; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getTriggerType() { return triggerType; }
    public void setTriggerType(String triggerType) { this.triggerType = triggerType; }

    public JsonNode getInputs() { return inputs; }
    public void setInputs(JsonNode inputs) { this.inputs = inputs; }

    public JsonNode getOutputs() { return outputs; }
    public void setOutputs(JsonNode outputs) { this.outputs = outputs; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getEndedAt() { return endedAt; }
    public void setEndedAt(Instant endedAt) { this.endedAt = endedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public UUID getTriggerId() { return triggerId; }
    public void setTriggerId(UUID triggerId) { this.triggerId = triggerId; }

    public Instant getWaitUntil() { return waitUntil; }
    public void setWaitUntil(Instant waitUntil) { this.waitUntil = waitUntil; }

    public String getLeasedBy() { return leasedBy; }
    public void setLeasedBy(String leasedBy) { this.leasedBy = leasedBy; }

    public Instant getLeasedUntil() { return leasedUntil; }
    public void setLeasedUntil(Instant leasedUntil) { this.leasedUntil = leasedUntil; }
}
