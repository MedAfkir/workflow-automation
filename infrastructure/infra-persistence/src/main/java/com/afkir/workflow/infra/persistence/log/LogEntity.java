package com.afkir.workflow.infra.persistence.log;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "task_run_log")
public class LogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "execution_id", nullable = false)
    private UUID executionId;

    @Column(name = "task_run_id")
    private UUID taskRunId;

    @Column(nullable = false, length = 8)
    private String level;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "logged_at", nullable = false)
    private Instant loggedAt;

    protected LogEntity() {}

    public LogEntity(UUID executionId, UUID taskRunId,
                     String level, String message, Instant loggedAt) {
        this.executionId = executionId;
        this.taskRunId = taskRunId;
        this.level = level;
        this.message = message;
        this.loggedAt = loggedAt;
    }

    public Long getId() { return id; }
    public UUID getExecutionId() { return executionId; }
    public UUID getTaskRunId() { return taskRunId; }
    public String getLevel() { return level; }
    public String getMessage() { return message; }
    public Instant getLoggedAt() { return loggedAt; }
}
