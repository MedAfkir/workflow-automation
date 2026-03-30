CREATE TABLE workflow (
    id                  UUID         PRIMARY KEY,
    namespace           VARCHAR(64)  NOT NULL,
    "key"               VARCHAR(64)  NOT NULL,
    current_revision_id UUID,
    enabled             BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_workflow_namespace_key UNIQUE (namespace, "key")
);

CREATE TABLE workflow_revision (
    id           UUID         PRIMARY KEY,
    workflow_id  UUID         NOT NULL,
    revision     INTEGER      NOT NULL,
    source_yaml  TEXT         NOT NULL,
    parsed_json  JSONB        NOT NULL,
    hash         VARCHAR(64)  NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_workflow_revision_unique     UNIQUE (workflow_id, revision),
    CONSTRAINT chk_workflow_revision_positive  CHECK (revision >= 1)
);

CREATE INDEX idx_workflow_revision_workflow_id ON workflow_revision (workflow_id);

CREATE TABLE execution (
    id                   UUID         PRIMARY KEY,
    workflow_id          UUID         NOT NULL,
    workflow_revision_id UUID         NOT NULL,
    state                VARCHAR(32)  NOT NULL,
    trigger_type         VARCHAR(32)  NOT NULL DEFAULT 'MANUAL',
    trigger_id           UUID,
    inputs               JSONB,
    outputs              JSONB,
    error_message        TEXT,
    started_at           TIMESTAMPTZ,
    ended_at             TIMESTAMPTZ,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    wait_until           TIMESTAMPTZ,
    leased_by            VARCHAR(128),
    leased_until         TIMESTAMPTZ,
    CONSTRAINT chk_execution_state CHECK (
        state IN ('CREATED', 'RUNNING', 'SUCCESS', 'FAILED', 'KILLED')
    )
);

CREATE INDEX idx_execution_workflow_id     ON execution (workflow_id);
CREATE INDEX idx_execution_state           ON execution (state);
CREATE INDEX idx_execution_created_at_desc ON execution (created_at DESC);
CREATE INDEX idx_execution_trigger_id
    ON execution (trigger_id)
    WHERE trigger_id IS NOT NULL;

CREATE INDEX idx_execution_pickable
    ON execution (state, wait_until)
    WHERE state = 'CREATED';

CREATE TABLE task_run (
    id                  UUID         PRIMARY KEY,
    execution_id        UUID         NOT NULL,
    task_id             VARCHAR(64)  NOT NULL,
    task_type           VARCHAR(255) NOT NULL,
    parent_task_run_id  UUID,
    iteration           INTEGER,
    sequence            INTEGER      NOT NULL,
    state               VARCHAR(32)  NOT NULL,
    attempt             INTEGER      NOT NULL DEFAULT 1,
    inputs              JSONB,
    outputs             JSONB,
    error_message       TEXT,
    error_code          VARCHAR(64),
    started_at          TIMESTAMPTZ,
    ended_at            TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_task_run_execution
        FOREIGN KEY (execution_id) REFERENCES execution (id) ON DELETE CASCADE,
    CONSTRAINT fk_task_run_parent
        FOREIGN KEY (parent_task_run_id) REFERENCES task_run (id) ON DELETE CASCADE,
    CONSTRAINT chk_task_run_state CHECK (
        state IN ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'SKIPPED', 'WAITING')
    ),
    CONSTRAINT chk_task_run_attempt_positive   CHECK (attempt >= 1),
    CONSTRAINT chk_task_run_sequence_positive  CHECK (sequence >= 0)
);

CREATE INDEX idx_task_run_execution_sequence ON task_run (execution_id, sequence);
CREATE INDEX idx_task_run_parent
    ON task_run (parent_task_run_id)
    WHERE parent_task_run_id IS NOT NULL;

CREATE TABLE trigger (
    id                   UUID         PRIMARY KEY,
    workflow_id          UUID         NOT NULL,
    workflow_revision_id UUID         NOT NULL,
    trigger_id           VARCHAR(64)  NOT NULL,
    type                 VARCHAR(255) NOT NULL,
    config               JSONB        NOT NULL,
    enabled              BOOLEAN      NOT NULL DEFAULT TRUE,
    next_evaluation_at   TIMESTAMPTZ,
    last_evaluation_at   TIMESTAMPTZ,
    webhook_key          VARCHAR(64),
    error_message        TEXT,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_trigger_webhook_key UNIQUE (webhook_key)
);

CREATE INDEX idx_trigger_workflow_id ON trigger (workflow_id);

CREATE INDEX idx_trigger_polled_ready
    ON trigger (next_evaluation_at)
    WHERE enabled = TRUE AND webhook_key IS NULL;

ALTER TABLE execution
    ADD CONSTRAINT fk_execution_trigger
        FOREIGN KEY (trigger_id) REFERENCES trigger (id) ON DELETE SET NULL;

CREATE TABLE idempotency_key (
    "key"        VARCHAR(128) PRIMARY KEY,
    namespace    VARCHAR(64)  NOT NULL,
    execution_id UUID         NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    expires_at   TIMESTAMPTZ  NOT NULL
);

CREATE INDEX idx_idempotency_key_expires ON idempotency_key (expires_at);
