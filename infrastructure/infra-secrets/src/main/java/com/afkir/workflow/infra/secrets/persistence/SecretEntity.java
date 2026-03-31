package com.afkir.workflow.infra.secrets.persistence;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "secret")
public class SecretEntity {

    @Id
    private UUID id;

    @Column(nullable = false, length = 64)
    private String namespace;

    @Column(name = "key_name", nullable = false, length = 128)
    private String keyName;

    @Column(name = "iv", nullable = false, columnDefinition = "BYTEA")
    private byte[] iv;

    @Column(name = "ciphertext", nullable = false, columnDefinition = "BYTEA")
    private byte[] ciphertext;

    @Column(nullable = false)
    private int version;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected SecretEntity() {
    }

    public SecretEntity(UUID id, String namespace, String keyName,
                        byte[] iv, byte[] ciphertext, int version) {
        this.id = id;
        this.namespace = namespace;
        this.keyName = keyName;
        this.iv = iv;
        this.ciphertext = ciphertext;
        this.version = version;
        var now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getNamespace() { return namespace; }
    public void setNamespace(String namespace) { this.namespace = namespace; }

    public String getKeyName() { return keyName; }
    public void setKeyName(String keyName) { this.keyName = keyName; }

    public byte[] getIv() { return iv; }
    public void setIv(byte[] iv) { this.iv = iv; }

    public byte[] getCiphertext() { return ciphertext; }
    public void setCiphertext(byte[] ciphertext) { this.ciphertext = ciphertext; }

    public int getVersion() { return version; }
    public void setVersion(int version) { this.version = version; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
