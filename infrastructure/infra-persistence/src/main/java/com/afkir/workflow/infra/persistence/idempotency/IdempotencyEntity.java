package com.afkir.workflow.infra.persistence.idempotency;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "idempotency_key")
public class IdempotencyEntity {

    @Id
    @Column(name = "key", length = 128)
    private String key;

    @Column(nullable = false, length = 64)
    private String namespace;

    @Column(name = "execution_id", nullable = false)
    private UUID executionId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    protected IdempotencyEntity() {
    }

    public IdempotencyEntity(String key, String namespace, UUID executionId,
                             Instant createdAt, Instant expiresAt) {
        this.key = key;
        this.namespace = namespace;
        this.executionId = executionId;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getNamespace() { return namespace; }
    public void setNamespace(String namespace) { this.namespace = namespace; }

    public UUID getExecutionId() { return executionId; }
    public void setExecutionId(UUID executionId) { this.executionId = executionId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
}
