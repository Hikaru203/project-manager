CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL,
    project_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    author_id UUID NOT NULL,
    author_name VARCHAR(200),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_task ON comments(task_id);
CREATE INDEX idx_comments_project ON comments(project_id);
CREATE INDEX idx_comments_tenant ON comments(tenant_id);
