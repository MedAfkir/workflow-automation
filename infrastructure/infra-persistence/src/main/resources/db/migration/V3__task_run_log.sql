CREATE TABLE task_run_log (
    id            BIGSERIAL    PRIMARY KEY,
    execution_id  UUID         NOT NULL,
    task_run_id   UUID,
    level         VARCHAR(8)   NOT NULL,
    message       TEXT         NOT NULL,
    logged_at     TIMESTAMPTZ  NOT NULL,
    CONSTRAINT fk_task_run_log_execution
        FOREIGN KEY (execution_id) REFERENCES execution (id) ON DELETE CASCADE,
    CONSTRAINT fk_task_run_log_task_run
        FOREIGN KEY (task_run_id)  REFERENCES task_run  (id) ON DELETE CASCADE,
    CONSTRAINT chk_task_run_log_level CHECK (
        level IN ('TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR')
    )
);

CREATE INDEX idx_task_run_log_execution_id_id
    ON task_run_log (execution_id, id);
