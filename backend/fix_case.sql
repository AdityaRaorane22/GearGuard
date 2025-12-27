-- Update any existing 'equipment' values to 'EQUIPMENT' in case there are lowercase ones
UPDATE maintenance_requests 
SET target_type = 'EQUIPMENT'::maintenancetargettype
WHERE target_type::text = 'equipment';

-- Verify all values are uppercase
SELECT target_type, COUNT(*) 
FROM maintenance_requests 
GROUP BY target_type;
