\copy (
  SELECT 
      s.*
  FROM settlement s
) TO '/tmp/point_settlements.csv' WITH CSV HEADER;


\copy (
  SELECT 
      s.*,
      ST_AsText(geom) AS geom_wkt
  FROM settlement s
) TO '/tmp/settlements_with_wkt.csv' WITH CSV HEADER;


\copy (
  SELECT (s.*) EXCEPT (geom)
  FROM settlement s
) TO '/tmp/settlements_no_geom.csv' WITH CSV HEADER;