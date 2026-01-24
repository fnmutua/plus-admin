DO $$
DECLARE
  fac_table text;
  geom_col  text := 'geom';      -- change if facility geometry column differs
  sett_tbl  text := 'settlement';-- settlement table name
  updated_count bigint;
BEGIN
  -- List of facility tables to update
  FOR fac_table IN
    SELECT unnest(ARRAY[
      'water_point',
      'sewer',
      'piped_water',
      'road',
      'streetlight',
      'crime_hotspot',
      'community_project',
      'health_facility',
      'education_facility',
      'community_hall',
      'police_station',
      'mast',
      'dumping_site',
      'hazard_zone',
      'powerline'
    ])
  LOOP
    RAISE NOTICE 'Updating %...', fac_table;

    EXECUTE format(
      $sql$
      UPDATE %I f
      SET settlement_id = s.id
      FROM %I s
      WHERE f.%I IS NOT NULL
        AND s.geom IS NOT NULL
        AND ST_Intersects(f.%I, s.geom);
      $sql$,
      fac_table, sett_tbl, geom_col, geom_col
    );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE '% updated rows: %', fac_table, updated_count;
  END LOOP;
END $$;


-- psql -h localhost -p 5432 -U postgres -d kesmis -f tools/update_facilities__settlement_id.sql