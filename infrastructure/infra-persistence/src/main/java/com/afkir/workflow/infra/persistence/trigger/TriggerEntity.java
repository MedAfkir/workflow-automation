package com.afkir.workflow.infra.persistence.trigger;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import tools.jackson.databind.JsonNode;
import jakarta.persistence.*;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "trigger")
public class TriggerEntity {

    @Id
    private UUID id;

    @Column(name = "workflow_id", nullable = false)
    private UUID workflowId;

    @Column(name = "workflow_revision_id", nullable = false)
    private UUID workflowRevisionId;

    @Column(name = "trigger_id", nullable = false, length = 64)
    private String triggerId;

    @Column(nullable = false, length = 255)
    private String type;

    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private JsonNode config;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "next_evaluation_at")
    private Instant nextEvaluationAt;

    @Column(name = "last_evaluation_at")
    private Instant lastEvaluationAt;

    @Column(name = "webhook_key", length = 64, unique = true)
    private String webhookKey;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected TriggerEntity() {
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getWorkflowId() { return workflowId; }
    public void setWorkflowId(UUID workflowId) { this.workflowId = workflowId; }

    public UUID getWorkflowRevisionId() { return workflowRevisionId; }
    public void setWorkflowRevisionId(UUID workflowRevisionId) { this.workflowRevisionId = workflowRevisionId; }

    public String getTriggerId() { return triggerId; }
    public void setTriggerId(String triggerId) { this.triggerId = triggerId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public JsonNode getConfig() { return config; }
    public void setConfig(JsonNode config) { this.config = config; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public Instant getNextEvaluationAt() { return nextEvaluationAt; }
    public void setNextEvaluationAt(Instant nextEvaluationAt) { this.nextEvaluationAt = nextEvaluationAt; }

    public Instant getLastEvaluationAt() { return lastEvaluationAt; }
    public void setLastEvaluationAt(Instant lastEvaluationAt) { this.lastEvaluationAt = lastEvaluationAt; }

    public String getWebhookKey() { return webhookKey; }
    public void setWebhookKey(String webhookKey) { this.webhookKey = webhookKey; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
