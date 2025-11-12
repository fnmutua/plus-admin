-- Add National GRM confirmation columns to grievance table
-- These columns allow national GRM to confirm resolutions made at settlement and county levels

-- Add confirmed_by_national_grm column (boolean flag)
ALTER TABLE grievance 
ADD COLUMN IF NOT EXISTS confirmed_by_national_grm BOOLEAN DEFAULT false;

-- Add confirmed_by_user_id column (reference to the user who confirmed)
ALTER TABLE grievance 
ADD COLUMN IF NOT EXISTS confirmed_by_user_id INTEGER;

-- Add date_confirmed_by_national_grm column (timestamp of confirmation)
ALTER TABLE grievance 
ADD COLUMN IF NOT EXISTS date_confirmed_by_national_grm TIMESTAMP;

-- Add confirmation_level column (tracks which level was confirmed: 'settlement' or 'county')
ALTER TABLE grievance 
ADD COLUMN IF NOT EXISTS confirmation_level VARCHAR(50);

-- Add confirmation_notes column (optional notes/comments from the confirming officer)
ALTER TABLE grievance 
ADD COLUMN IF NOT EXISTS confirmation_notes TEXT;

-- Optional: Add foreign key constraint for confirmed_by_user_id
-- Uncomment if you want to enforce referential integrity
-- ALTER TABLE grievance
-- ADD CONSTRAINT fk_grievance_confirmed_by_user
-- FOREIGN KEY (confirmed_by_user_id) REFERENCES users(id);

-- Optional: Add index for better query performance when filtering by confirmation status
CREATE INDEX IF NOT EXISTS idx_grievance_confirmed_by_national_grm 
ON grievance(confirmed_by_national_grm);

CREATE INDEX IF NOT EXISTS idx_grievance_confirmation_level 
ON grievance(confirmation_level);

