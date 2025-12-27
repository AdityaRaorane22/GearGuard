-- Check current columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'maintenance_requests'
ORDER BY ordinal_position;

-- Add work_center_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'maintenance_requests' 
                   AND column_name = 'work_center_id') THEN
        ALTER TABLE maintenance_requests 
        ADD COLUMN work_center_id INTEGER NULL 
        REFERENCES work_centers(id);
        RAISE NOTICE 'Added work_center_id column';
    ELSE
        RAISE NOTICE 'work_center_id already exists';
    END IF;
END $$;

-- Create enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenancetargettype') THEN
        CREATE TYPE maintenancetargettype AS ENUM ('equipment', 'work_center');
        RAISE NOTICE 'Created maintenancetargettype enum';
    ELSE
        RAISE NOTICE 'maintenancetargettype enum already exists';
    END IF;
END $$;

-- Add target_type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'maintenance_requests' 
                   AND column_name = 'target_type') THEN
        ALTER TABLE maintenance_requests 
        ADD COLUMN target_type maintenancetargettype NOT NULL DEFAULT 'equipment';
        RAISE NOTICE 'Added target_type column';
    ELSE
        RAISE NOTICE 'target_type already exists';
    END IF;
END $$;

-- Make equipment_id nullable
DO $$
BEGIN
    ALTER TABLE maintenance_requests 
    ALTER COLUMN equipment_id DROP NOT NULL;
    RAISE NOTICE 'Made equipment_id nullable';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'equipment_id already nullable or error: %', SQLERRM;
END $$;

-- Verify final schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'maintenance_requests'
ORDER BY ordinal_position;
