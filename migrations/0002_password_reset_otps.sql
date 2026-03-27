CREATE TABLE IF NOT EXISTS password_reset_otps (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  otp_salt TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email
  ON password_reset_otps(email);

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expires_at
  ON password_reset_otps(expires_at);
