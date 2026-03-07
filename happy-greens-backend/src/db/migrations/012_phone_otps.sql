-- ============================================================
-- Migration 012: Phone OTP Passwordless Authentication
-- ============================================================

CREATE TABLE IF NOT EXISTS phone_otps (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching unverified/unexpired OTPs quickly
CREATE INDEX IF NOT EXISTS idx_phone_otps_phone_expires ON phone_otps(phone, expires_at);
