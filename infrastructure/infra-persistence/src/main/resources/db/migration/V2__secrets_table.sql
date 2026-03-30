CREATE TABLE secret (
    id           UUID         PRIMARY KEY,
    namespace    VARCHAR(64)  NOT NULL,
    key_name     VARCHAR(128) NOT NULL,
    iv           BYTEA        NOT NULL,    
    ciphertext   BYTEA        NOT NULL,    
    version      INTEGER      NOT NULL DEFAULT 1,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_secret_namespace_key UNIQUE (namespace, key_name),
    CONSTRAINT chk_secret_version_positive CHECK (version >= 1),
    CONSTRAINT chk_secret_iv_length CHECK (octet_length(iv) = 12),
    CONSTRAINT chk_secret_ciphertext_min_length CHECK (octet_length(ciphertext) >= 16)
);

CREATE INDEX idx_secret_namespace ON secret (namespace);
