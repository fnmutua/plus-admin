-- Add has_facilities column to settlement table
-- This column tracks whether a settlement contains any facilities
-- Facilities include: health_facility, education_facility, water_point, piped_water, sewer, other_facility

ALTER TABLE settlement 
ADD COLUMN IF NOT EXISTS has_facilities BOOLEAN DEFAULT false;

-- Create index for better query performance when filtering by has_facilities
CREATE INDEX IF NOT EXISTS idx_settlement_has_facilities ON settlement(has_facilities);
