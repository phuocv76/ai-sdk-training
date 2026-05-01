-- Default portal admin: admin@admin.com / Abcd@123
-- Change the password after first login in production. Skips if this email already exists.
INSERT OR IGNORE INTO users (id, name, email, created_at, password_hash, role)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'Default Admin',
  'admin@admin.com',
  1735689600000,
  'pbkdf2-sha256:210000:YWRtaW5zZWVkU2FsdCEhMTY=:d+6F3ZOEP/9NcdTC6/jI4mFlHJXPon7/5r3vGbv7kK8=',
  'admin'
);
