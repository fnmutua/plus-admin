-- Add project_phase column to grievance table
ALTER TABLE grievance 
ADD COLUMN IF NOT EXISTS project_phase VARCHAR(255) DEFAULT 'KISIP 2';

-- Update existing rows to have the default value (optional, only if you want to set it for existing records)
 

UPDATE public.grievance
SET project_phase =   'KISIP 1' 
WHERE date_reported < DATE '2024-01-01';



UPDATE public.grievance
SET project_phase =   'KISIP 2' 
WHERE date_reported  >= DATE '2024-01-01';


UPDATE public.grievance
SET project_phase =   'KISIP 2' 
WHERE date_reported IS NULL
 