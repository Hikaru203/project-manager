CREATE TABLE IF NOT EXISTS task_assignees (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    PRIMARY KEY (task_id, user_id)
);

-- Migrating old assignees if any (Optional but good)
INSERT INTO task_assignees (task_id, user_id)
SELECT id, assignee_id FROM tasks WHERE assignee_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Dropping old columns as they are no longer in the Entity
ALTER TABLE tasks DROP COLUMN IF EXISTS assignee_id;
ALTER TABLE tasks DROP COLUMN IF EXISTS assignee_name;
