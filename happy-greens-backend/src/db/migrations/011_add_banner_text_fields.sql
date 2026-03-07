-- Add description and subheading columns to banners table
ALTER TABLE banners ADD COLUMN IF NOT EXISTS subheading VARCHAR(255);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS description TEXT;
