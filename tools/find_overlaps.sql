SELECT
  a.id AS a_id,
  a.name as lefft,
  b.id AS b_id,
  b.name as rright,
  a.county_id,

  ST_Area(
    ST_Intersection(a.g36, b.g36)
  ) / 1000000.0 AS overlap_sqkm

FROM (
  SELECT id, name, county_id, ST_Buffer(ST_MakeValid(ST_Transform(geom,21036)),0) AS g36
  FROM settlement
) a
JOIN (
  SELECT id,name,  county_id, ST_Buffer(ST_MakeValid(ST_Transform(geom,21036)),0) AS g36
  FROM settlement
) b
  ON a.id < b.id
 AND a.county_id = b.county_id
 AND ST_Intersects(a.g36, b.g36);