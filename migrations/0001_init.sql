-- Migration number: 0001 	 2026-05-04T15:45:38.811Z

CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  password TEXT,
  date_of_birth TEXT,
  bio TEXT
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

-- Default admin (development): admin@admin.com / Abcd@123
-- Password: PBKDF2-SHA256, 210k iterations, salt "default-admin-sl" (see src/lib/password.ts).
INSERT INTO users (
  id,
  name,
  email,
  role,
  created_at,
  password,
  date_of_birth,
  bio
) VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'Admin',
  'admin@admin.com',
  'admin',
  1767225600000,
  'pbkdf2-sha256:210000:ZGVmYXVsdC1hZG1pbi1zbA==:C7OUQuF4SkGZ7MjSUHv7+2ox4nQHwXjYQ52XC98hq6I=',
  NULL,
  NULL
);
