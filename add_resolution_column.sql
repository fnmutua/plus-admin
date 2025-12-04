-- Add resolution column to grievance table
-- This column stores the action taken when a grievance is marked as resolved

ALTER TABLE grievance 
ADD COLUMN IF NOT EXISTS resolution TEXT;





ALTER TABLE county 
ADD COLUMN IF NOT EXISTS pop_male Integer;
ALTER TABLE county 
ADD COLUMN IF NOT EXISTS pop_female Integer;

ALTER TABLE county 
ADD COLUMN IF NOT EXISTS pop_intersex Integer; 


ALTER TABLE county 
ADD COLUMN IF NOT EXISTS pop_total Integer; 