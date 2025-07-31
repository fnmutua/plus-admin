DO $$
DECLARE
    tbl TEXT;
    tables TEXT[] := ARRAY[
		'road_asset',
		'road',
        'crime_hotspot',
        'dumping_site',
        'education_facility',
        'floodlight',
        'hazard_zone',
        'health_facility',
        'police_station',
        'piped_water',
        'parcel',
		'river',
		'streetlight',
		'water_point',
        'other_facility',
        'mast',
        'powerline',
        'structure',
        'structures',
        'sewer',
        'railway'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I CASCADE;', tbl);
    END LOOP;
END $$;
