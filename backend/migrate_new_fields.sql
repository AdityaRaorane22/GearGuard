-- Migration: Add new fields to equipment and maintenance_requests tables
-- Run this with: psql -U your_user -d your_database -f migrate_new_fields.sql

-- Add columns to equipment table
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS assigned_date TIMESTAMP;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS scrap_date TIMESTAMP;

-- Add column to maintenance_requests table
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS duration DOUBLE PRECISION;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'equipment' 
  AND column_name IN ('description', 'assigned_date', 'scrap_date');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'maintenance_requests' 
  AND column_name = 'duration';
