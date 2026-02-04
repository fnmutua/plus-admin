-- Add date_logged column to grievance table
ALTER TABLE grievance 
ADD COLUMN date_logged TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Optional: Update existing records to set date_logged to date_reported if date_reported exists
-- UPDATE grievance 
-- SET date_logged = date_reported 
-- WHERE date_logged IS NULL AND date_reported IS NOT NULL;
