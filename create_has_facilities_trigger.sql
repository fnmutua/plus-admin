-- Create a function to update has_facilities for a settlement
-- This function can be called when facilities are added, updated, or deleted
-- Usage: SELECT update_settlement_has_facilities(settlement_id);

CREATE OR REPLACE FUNCTION update_settlement_has_facilities(settlement_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  has_facilities_flag BOOLEAN;
BEGIN
  SELECT (
    CASE WHEN EXISTS (
      SELECT 1 FROM health_facility hf 
      WHERE hf.geom IS NOT NULL 
      AND hf.settlement_id = update_settlement_has_facilities.settlement_id
      AND EXISTS (
        SELECT 1 FROM settlement s 
        WHERE s.id = update_settlement_has_facilities.settlement_id 
        AND s.geom IS NOT NULL 
        AND ST_Contains(s.geom, hf.geom)
      )
    ) OR EXISTS (
      SELECT 1 FROM education_facility ef 
      WHERE ef.geom IS NOT NULL 
      AND ef.settlement_id = update_settlement_has_facilities.settlement_id
      AND EXISTS (
        SELECT 1 FROM settlement s 
        WHERE s.id = update_settlement_has_facilities.settlement_id 
        AND s.geom IS NOT NULL 
        AND ST_Contains(s.geom, ef.geom)
      )
    ) OR EXISTS (
      SELECT 1 FROM water_point wp 
      WHERE wp.geom IS NOT NULL 
      AND wp.settlement_id = update_settlement_has_facilities.settlement_id
      AND EXISTS (
        SELECT 1 FROM settlement s 
        WHERE s.id = update_settlement_has_facilities.settlement_id 
        AND s.geom IS NOT NULL 
        AND ST_Contains(s.geom, wp.geom)
      )
    ) OR EXISTS (
      SELECT 1 FROM piped_water pw 
      WHERE pw.geom IS NOT NULL 
      AND pw.settlement_id = update_settlement_has_facilities.settlement_id
      AND EXISTS (
        SELECT 1 FROM settlement s 
        WHERE s.id = update_settlement_has_facilities.settlement_id 
        AND s.geom IS NOT NULL 
        AND ST_Intersects(s.geom, pw.geom)
      )
    ) OR EXISTS (
      SELECT 1 FROM sewer sv 
      WHERE sv.geom IS NOT NULL 
      AND sv.settlement_id = update_settlement_has_facilities.settlement_id
      AND EXISTS (
        SELECT 1 FROM settlement s 
        WHERE s.id = update_settlement_has_facilities.settlement_id 
        AND s.geom IS NOT NULL 
        AND ST_Intersects(s.geom, sv.geom)
      )
    ) OR EXISTS (
      SELECT 1 FROM other_facility of 
      WHERE of.geom IS NOT NULL 
      AND of.settlement_id = update_settlement_has_facilities.settlement_id
      AND EXISTS (
        SELECT 1 FROM settlement s 
        WHERE s.id = update_settlement_has_facilities.settlement_id 
        AND s.geom IS NOT NULL 
        AND ST_Contains(s.geom, of.geom)
      )
    ) THEN true ELSE false END
  ) INTO has_facilities_flag;
  
  UPDATE settlement 
  SET has_facilities = COALESCE(has_facilities_flag, false)
  WHERE id = update_settlement_has_facilities.settlement_id;
  
  RETURN has_facilities_flag;
END;
$$ LANGUAGE plpgsql;

-- Note: To automatically update has_facilities when facilities change, you can create triggers
-- Example trigger for health_facility (repeat for other facility tables):
-- 
-- CREATE OR REPLACE FUNCTION trigger_update_settlement_has_facilities()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF TG_OP = 'DELETE' THEN
--     PERFORM update_settlement_has_facilities(OLD.settlement_id);
--     RETURN OLD;
--   ELSE
--     PERFORM update_settlement_has_facilities(NEW.settlement_id);
--     RETURN NEW;
--   END IF;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER health_facility_settlement_update
--   AFTER INSERT OR UPDATE OR DELETE ON health_facility
--   FOR EACH ROW
--   EXECUTE FUNCTION trigger_update_settlement_has_facilities();
