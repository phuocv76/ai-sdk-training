-- Initial schema + bootstrap data
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  first_name TEXT,
  last_name TEXT,
  date_of_birth TEXT,
  bio TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Default portal admin: admin@admin.com / Abcd@123
-- Change the password after first login in production. Skips if this email already exists.
INSERT OR IGNORE INTO users (
  id,
  name,
  email,
  created_at,
  password,
  role,
  first_name,
  last_name
)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'Default Admin',
  'admin@admin.com',
  1735689600000,
  'pbkdf2-sha256:210000:YWRtaW5zZWVkU2FsdCEhMTY=:d+6F3ZOEP/9NcdTC6/jI4mFlHJXPon7/5r3vGbv7kK8=',
  'admin',
  'Default',
  'Admin'
);
