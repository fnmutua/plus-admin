-- SQL script to add 'id' field to tables that are missing it
-- Run this script on your PostgreSQL database

-- Function to safely add id column if it doesn't exist
DO $$
BEGIN
    -- 1. streetlight (from street_light model)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'streetlight' AND column_name = 'id'
    ) THEN
        ALTER TABLE streetlight ADD COLUMN id SERIAL PRIMARY KEY;
        RAISE NOTICE 'Added id column to streetlight table';
    ELSE
        RAISE NOTICE 'streetlight table already has id column';
    END IF;

    -- 2. mast
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mast' AND column_name = 'id'
    ) THEN
        ALTER TABLE mast ADD COLUMN id SERIAL PRIMARY KEY;
        RAISE NOTICE 'Added id column to mast table';
    ELSE
        RAISE NOTICE 'mast table already has id column';
    END IF;

    -- 3. floodlight
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'floodlight' AND column_name = 'id'
    ) THEN
        ALTER TABLE floodlight ADD COLUMN id SERIAL PRIMARY KEY;
        RAISE NOTICE 'Added id column to floodlight table';
    ELSE
        RAISE NOTICE 'floodlight table already has id column';
    END IF;

    -- 4. dumping_site
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dumping_site' AND column_name = 'id'
    ) THEN
        ALTER TABLE dumping_site ADD COLUMN id SERIAL PRIMARY KEY;
        RAISE NOTICE 'Added id column to dumping_site table';
    ELSE
        RAISE NOTICE 'dumping_site table already has id column';
    END IF;

    -- 5. hazard_zone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hazard_zone' AND column_name = 'id'
    ) THEN
        ALTER TABLE hazard_zone ADD COLUMN id SERIAL PRIMARY KEY;
        RAISE NOTICE 'Added id column to hazard_zone table';
    ELSE
        RAISE NOTICE 'hazard_zone table already has id column';
    END IF;

    -- 6. water_point
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'water_point' AND column_name = 'id'
    ) THEN
        ALTER TABLE water_point ADD COLUMN id SERIAL PRIMARY KEY;
        RAISE NOTICE 'Added id column to water_point table';
    ELSE
        RAISE NOTICE 'water_point table already has id column';
    END IF;

    -- 7. community_hall
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'community_hall' AND column_name = 'id'
    ) THEN
        ALTER TABLE community_hall ADD COLUMN id SERIAL PRIMARY KEY;
        RAISE NOTICE 'Added id column to community_hall table';
    ELSE
        RAISE NOTICE 'community_hall table already has id column';
    END IF;

    -- 8. crime_hotspot
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crime_hotspot' AND column_name = 'id'
    ) THEN
        ALTER TABLE crime_hotspot ADD COLUMN id SERIAL PRIMARY KEY;
        RAISE NOTICE 'Added id column to crime_hotspot table';
    ELSE
        RAISE NOTICE 'crime_hotspot table already has id column';
    END IF;

    -- 9. police_station
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'police_station' AND column_name = 'id'
    ) THEN
        ALTER TABLE police_station ADD COLUMN id SERIAL PRIMARY KEY;
        RAISE NOTICE 'Added id column to police_station table';
    ELSE
        RAISE NOTICE 'police_station table already has id column';
    END IF;

    -- 10. railway
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'railway' AND column_name = 'id'
    ) THEN
        ALTER TABLE railway ADD COLUMN id SERIAL PRIMARY KEY;
        RAISE NOTICE 'Added id column to railway table';
    ELSE
        RAISE NOTICE 'railway table already has id column';
    END IF;

END $$;

-- Alternative: If you prefer individual ALTER TABLE statements (run only if column doesn't exist)
-- Uncomment and run these one by one if the DO block doesn't work for your PostgreSQL version

/*
-- Check first if columns exist:
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name IN ('streetlight', 'mast', 'floodlight', 'dumping_site', 'hazard_zone', 
                     'water_point', 'community_hall', 'crime_hotspot', 'police_station', 'railway')
AND column_name = 'id';

-- Then run these ALTER TABLE statements for tables missing the id column:

ALTER TABLE streetlight ADD COLUMN id SERIAL PRIMARY KEY;
ALTER TABLE mast ADD COLUMN id SERIAL PRIMARY KEY;
ALTER TABLE floodlight ADD COLUMN id SERIAL PRIMARY KEY;
ALTER TABLE dumping_site ADD COLUMN id SERIAL PRIMARY KEY;
ALTER TABLE hazard_zone ADD COLUMN id SERIAL PRIMARY KEY;
ALTER TABLE water_point ADD COLUMN id SERIAL PRIMARY KEY;
ALTER TABLE community_hall ADD COLUMN id SERIAL PRIMARY KEY;
ALTER TABLE crime_hotspot ADD COLUMN id SERIAL PRIMARY KEY;
ALTER TABLE police_station ADD COLUMN id SERIAL PRIMARY KEY;
ALTER TABLE railway ADD COLUMN id SERIAL PRIMARY KEY;
*/

-- Note: If tables already have data and an id column exists but isn't a primary key,
-- you may need to:
-- 1. Drop the existing id column (if it's not being used as foreign key)
-- 2. Re-add it as SERIAL PRIMARY KEY
-- Or convert existing id to primary key:
-- ALTER TABLE table_name ADD PRIMARY KEY (id);
