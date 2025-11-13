-- Add resolution column to grievance table
-- This column stores the action taken when a grievance is marked as resolved

ALTER TABLE grievance 
ADD COLUMN IF NOT EXISTS resolution TEXT;

