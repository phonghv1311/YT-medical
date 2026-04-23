-- Part 2: Roles & Permissions

CREATE TABLE IF NOT EXISTS roles (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(50)     NOT NULL UNIQUE,
    display_name    VARCHAR(100)    NOT NULL,
    description     TEXT,
    is_system       BOOLEAN         DEFAULT FALSE,
    is_default      BOOLEAN         DEFAULT FALSE,
    level           INT             DEFAULT 0,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100)    NOT NULL UNIQUE,
    module          VARCHAR(50)     NOT NULL,
    description     TEXT,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id         UUID            NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   UUID            NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);

CREATE TABLE IF NOT EXISTS user_roles (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id         UUID            NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by     UUID            REFERENCES users(id),
    assigned_at     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
