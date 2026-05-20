-- Runs automatically when PostgreSQL container starts for the first time

CREATE TABLE IF NOT EXISTS tasks (
    id         SERIAL PRIMARY KEY,
    title      TEXT         NOT NULL,
    done       BOOLEAN      NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_created_at 
    ON tasks(created_at DESC);

-- Seed data so the app isn't empty on first run
INSERT INTO tasks (title, done) VALUES
    ('Deploy to Kubernetes', false),
    ('Setup Helm charts', false),
    ('Configure ArgoCD', false),
    ('Setup Grafana monitoring', false);