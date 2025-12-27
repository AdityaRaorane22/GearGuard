-- Step 1: Check current state
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'maintenance_requests' AND column_name IN ('target_type', 'work_center_id');

-- Step 2: Drop the target_type column if it exists (this will allow us to recreate it properly)
ALTER TABLE maintenance_requests DROP COLUMN IF EXISTS target_type;

-- Step 3: Drop the old enum type completely
DROP TYPE IF EXISTS maintenancetargettype CASCADE;

-- Step 4: Create the enum with LOWERCASE values (matching Python code)
CREATE TYPE maintenancetargettype AS ENUM ('equipment', 'work_center');

-- Step 5: Add the target_type column with the correct enum
-- Set default to 'equipment' for existing rows
ALTER TABLE maintenance_requests 
ADD COLUMN target_type maintenancetargettype NOT NULL DEFAULT 'equipment';

-- Step 6: Ensure work_center_id exists
ALTER TABLE maintenance_requests 
ADD COLUMN IF NOT EXISTS work_center_id INTEGER NULL 
REFERENCES work_centers(id);

-- Step 7: Make equipment_id nullable
ALTER TABLE maintenance_requests 
ALTER COLUMN equipment_id DROP NOT NULL;

-- Step 8: Verify the final schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'maintenance_requests' 
  AND column_name IN ('target_type', 'work_center_id', 'equipment_id')
ORDER BY ordinal_position;

-- Step 9: Check enum values are correct (should show: equipment, work_center)
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'maintenancetargettype'::regtype
ORDER BY enumsortorder;
