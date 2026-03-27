package com.afkir.workflow.infra.persistence.workflow;

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import tools.jackson.databind.JsonNode;
import jakarta.persistence.*;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workflow_revision")
public class WorkflowRevisionEntity {

    @Id
    private UUID id;

    @Column(name = "workflow_id", nullable = false)
    private UUID workflowId;

    @Column(nullable = false)
    private int revision;

    @Column(name = "source_yaml", nullable = false, columnDefinition = "TEXT")
    private String sourceYaml;

    @Type(JsonBinaryType.class)
    @Column(name = "parsed_json", columnDefinition = "jsonb", nullable = false)
    private JsonNode parsedJson;

    @Column(nullable = false, length = 64)
    private String hash;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected WorkflowRevisionEntity() {
    }

    public WorkflowRevisionEntity(UUID id, UUID workflowId, int revision,
                                  String sourceYaml, JsonNode parsedJson, String hash) {
        this.id = id;
        this.workflowId = workflowId;
        this.revision = revision;
        this.sourceYaml = sourceYaml;
        this.parsedJson = parsedJson;
        this.hash = hash;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getWorkflowId() { return workflowId; }
    public void setWorkflowId(UUID workflowId) { this.workflowId = workflowId; }

    public int getRevision() { return revision; }
    public void setRevision(int revision) { this.revision = revision; }

    public String getSourceYaml() { return sourceYaml; }
    public void setSourceYaml(String sourceYaml) { this.sourceYaml = sourceYaml; }

    public JsonNode getParsedJson() { return parsedJson; }
    public void setParsedJson(JsonNode parsedJson) { this.parsedJson = parsedJson; }

    public String getHash() { return hash; }
    public void setHash(String hash) { this.hash = hash; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
