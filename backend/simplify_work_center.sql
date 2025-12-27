-- Add work_center_name column (simple string, no FK)
ALTER TABLE maintenance_requests 
ADD COLUMN IF NOT EXISTS work_center_name VARCHAR(255) NULL;

-- Drop work_center_id FK if it exists
ALTER TABLE maintenance_requests 
DROP COLUMN IF EXISTS work_center_id CASCADE;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'maintenance_requests' 
  AND column_name LIKE '%work_center%';
