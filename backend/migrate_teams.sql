-- Migration: Add Maintenance Teams tables and Equipment/Request FKs
-- Run this with: psql -U your_user -d your_database -f migrate_teams.sql

-- 1. Create Maintenance Teams table
CREATE TABLE IF NOT EXISTS maintenance_teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    company VARCHAR(100) DEFAULT 'Adani Enterprises',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Team Members association table
CREATE TABLE IF NOT EXISTS team_members (
    team_id INTEGER REFERENCES maintenance_teams(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (team_id, user_id)
);

-- 3. Add FK to Equipment table
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS maintenance_team_id INTEGER;
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS fk_equipment_maintenance_team;
ALTER TABLE equipment ADD CONSTRAINT fk_equipment_maintenance_team FOREIGN KEY (maintenance_team_id) REFERENCES maintenance_teams(id);

-- 4. Add FK to Maintenance Requests table
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS maintenance_team_id INTEGER;
ALTER TABLE maintenance_requests DROP CONSTRAINT IF EXISTS fk_request_maintenance_team;
ALTER TABLE maintenance_requests ADD CONSTRAINT fk_request_maintenance_team FOREIGN KEY (maintenance_team_id) REFERENCES maintenance_teams(id);

-- Verify
SELECT * FROM information_schema.tables WHERE table_name IN ('maintenance_teams', 'team_members');
SELECT column_name FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'maintenance_team_id';
SELECT column_name FROM information_schema.columns WHERE table_name = 'maintenance_requests' AND column_name = 'maintenance_team_id';
