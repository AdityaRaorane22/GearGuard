-- First, check what values the enum currently has
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'maintenancetargettype'::regtype
ORDER BY enumsortorder;

-- Drop the existing enum type (this will fail if it's in use, which is good - we want to know)
DROP TYPE IF EXISTS maintenancetargettype CASCADE;

-- Recreate with correct lowercase values
CREATE TYPE maintenancetargettype AS ENUM ('equipment', 'work_center');

-- Now add the target_type column
ALTER TABLE maintenance_requests 
ADD COLUMN IF NOT EXISTS target_type maintenancetargettype NOT NULL DEFAULT 'equipment';

-- Add work_center_id if it doesn't exist (it already does according to your error)
ALTER TABLE maintenance_requests 
ADD COLUMN IF NOT EXISTS work_center_id INTEGER NULL 
REFERENCES work_centers(id);

-- Make equipment_id nullable
ALTER TABLE maintenance_requests 
ALTER COLUMN equipment_id DROP NOT NULL;

-- Verify final schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'maintenance_requests'
ORDER BY ordinal_position;
