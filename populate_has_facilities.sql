-- Populate has_facilities column for all existing settlements
-- This script checks for facilities within each settlement using PostGIS spatial functions
-- For point/polygon features: uses ST_Contains (containment check)
-- For linear features (piped_water, sewer): uses ST_Intersects (intersection check)

UPDATE settlement s
SET has_facilities = (
  CASE WHEN EXISTS (
    SELECT 1 FROM health_facility hf 
    WHERE hf.geom IS NOT NULL 
    AND s.geom IS NOT NULL 
    AND ST_Contains(s.geom, hf.geom)
  ) OR EXISTS (
    SELECT 1 FROM education_facility ef 
    WHERE ef.geom IS NOT NULL 
    AND s.geom IS NOT NULL 
    AND ST_Contains(s.geom, ef.geom)
  ) OR EXISTS (
    SELECT 1 FROM water_point wp 
    WHERE wp.geom IS NOT NULL 
    AND s.geom IS NOT NULL 
    AND ST_Contains(s.geom, wp.geom)
  ) OR EXISTS (
    SELECT 1 FROM piped_water pw 
    WHERE pw.geom IS NOT NULL 
    AND s.geom IS NOT NULL 
    AND ST_Intersects(s.geom, pw.geom)
  ) OR EXISTS (
    SELECT 1 FROM sewer sv 
    WHERE sv.geom IS NOT NULL 
    AND s.geom IS NOT NULL 
    AND ST_Intersects(s.geom, sv.geom)
  ) OR EXISTS (
    SELECT 1 FROM other_facility of 
    WHERE of.geom IS NOT NULL 
    AND s.geom IS NOT NULL 
    AND ST_Contains(s.geom, of.geom)
  ) THEN true ELSE false END
)
WHERE s.geom IS NOT NULL;

-- Update settlements without geometry to false (they can't contain facilities without geometry)
UPDATE settlement s
SET has_facilities = false
WHERE s.geom IS NULL;
