CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE pm_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    username VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pm_audit_tenant ON pm_audit_logs(tenant_id);
CREATE INDEX idx_pm_audit_entity ON pm_audit_logs(entity_type, entity_id);
CREATE INDEX idx_pm_audit_action ON pm_audit_logs(action);
CREATE INDEX idx_pm_audit_created ON pm_audit_logs(created_at DESC);
