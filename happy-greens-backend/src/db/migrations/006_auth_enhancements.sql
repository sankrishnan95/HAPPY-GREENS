-- =====================================================
-- Happy Greens E-commerce Database Schema
-- Migration 006: Auth Enhancements
-- =====================================================

-- Add google login ID
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Add phone verification status
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Password reset and OTP columns
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP,
  ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS otp_expires TIMESTAMP;
