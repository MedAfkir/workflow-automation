package com.afkir.workflow.infra.persistence.workflow;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workflow")
public class WorkflowEntity {

    @Id
    private UUID id;

    @Column(nullable = false, length = 64)
    private String namespace;

    @Column(name = "key", nullable = false, length = 64)
    private String key;

    @Column(name = "current_revision_id")
    private UUID currentRevisionId;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected WorkflowEntity() {
    }

    public WorkflowEntity(UUID id, String namespace, String key) {
        this.id = id;
        this.namespace = namespace;
        this.key = key;
        var now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getNamespace() { return namespace; }
    public void setNamespace(String namespace) { this.namespace = namespace; }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public UUID getCurrentRevisionId() { return currentRevisionId; }
    public void setCurrentRevisionId(UUID currentRevisionId) { this.currentRevisionId = currentRevisionId; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
