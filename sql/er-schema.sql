CREATE TABLE users (
    user_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL UNIQUE,
    role        VARCHAR(50)  NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE documents (
    doc_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    s3_url       VARCHAR(1024) NOT NULL,
    status       VARCHAR(50)  NOT NULL DEFAULT 'UPLOADED',
    uploaded_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_user   ON documents(user_id);

CREATE TABLE tasks (
    task_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id      UUID NOT NULL REFERENCES documents(doc_id) ON DELETE CASCADE,
    task_type   VARCHAR(50) NOT NULL,
    status      VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    worker_id   VARCHAR(100),
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_doc    ON tasks(doc_id);

CREATE TABLE validated_data (
    data_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id          UUID NOT NULL UNIQUE
                        REFERENCES documents(doc_id) ON DELETE CASCADE,
    inn             VARCHAR(12),
    amount          NUMERIC(14,2) CHECK (amount >= 0),
    doc_date        DATE,
    is_sent_to_erp  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE validation_rules (
    rule_id         SERIAL PRIMARY KEY,
    field_name      VARCHAR(50) NOT NULL,
    regex_pattern   TEXT        NOT NULL,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE
);
