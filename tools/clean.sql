
// get all settleemnt data 
select id, name, county_id, subcounty_id, ward_id, settlement_type, area, population_original, code, description, pop_density, parcel_no, parcel_owner, dist_town, dist_trunk, rim_no,   "isActive",  surveyed, landuse, near_river, on_wayleave, on_road_reserve, structure_types, typical_building_materials, avg_dist_between, encumbrance, comments, development, duplicate, num_households, avg_household_size, land_status, parcel_owner_type, electricity_availability, piped_water_availability, median_household_income, plot_ownership_ratio, plot_tenant_ratio, avg_rent, main_env_hazards, general_location, population, has_facilities
from settlement;




// clean settlement type 
UPDATE settlement
SET settlement_type = CASE
    -- SLUM variants
    WHEN LOWER(settlement_type) IN (
        'slum',
        'slum informal on community private land',
        'slum_informal_on_community_private_land'
    ) THEN 'Slum'

    -- INFORMAL SETTLEMENT variants
    WHEN LOWER(settlement_type) IN (
        'informal settlement',
        'informal_settlement',
        'informal',
        'urban',
        'peri urban',
        'peri_urban',
        'rural'
    ) THEN 'Informal Settlement'

    -- Handle N/A and anything else conservatively
    WHEN settlement_type IS NULL
         OR LOWER(settlement_type) IN ('n/a', 'na', '') THEN 'Informal Settlement'

    ELSE settlement_type
END;




//   structure types
BEGIN;

-- 1) NULL / N/A / other -> Semi-permanent
UPDATE settlement
SET structure_types = 'Semi-permanent'
WHERE structure_types IS NULL
   OR btrim(structure_types) = ''
   OR lower(btrim(structure_types)) IN ('n/a', 'na', 'other');

-- 2) Normalize everything to clean combos
UPDATE settlement
SET structure_types =
    trim(both ', ' FROM
        concat_ws(', ',
            CASE WHEN structure_types ILIKE '%perman%' THEN 'Permanent' END,
            CASE WHEN structure_types ILIKE '%semi%' THEN 'Semi-permanent' END,
            CASE WHEN structure_types ILIKE '%tempor%' THEN 'Temporary' END
        )
    );

-- 3) Quick check (should return 0)
SELECT COUNT(*) AS bad_rows
FROM settlement
WHERE structure_types IS NULL
   OR structure_types NOT IN (
        'Permanent',
        'Semi-permanent',
        'Temporary',
        'Permanent, Semi-permanent',
        'Permanent, Temporary',
        'Semi-permanent, Temporary',
        'Permanent, Semi-permanent, Temporary'
   );

COMMIT;


// surveyed

BEGIN;

-- 1) NULL / empty / Unknown -> Unknown
UPDATE settlement
SET surveyed = 'Unknown'
WHERE surveyed IS NULL
   OR btrim(surveyed) = ''
   OR lower(btrim(surveyed)) IN ('unknown', 'n/a', 'na');

-- 2) Explicit No
UPDATE settlement
SET surveyed = 'No'
WHERE lower(btrim(surveyed)) = 'no';

-- 3) Anything that clearly indicates a survey -> Yes
UPDATE settlement
SET surveyed = 'Yes'
WHERE surveyed ILIKE '%survey%'
   OR surveyed ~* '\d{4}'                 -- year like 2019, 2024
   OR surveyed ~* '\d{1,2}/\d{1,2}/\d{4}' -- dates like 6/24/2019
   OR lower(btrim(surveyed)) = 'yes';

-- 4) Safety net: anything else -> Unknown
UPDATE settlement
SET surveyed = 'Unknown'
WHERE surveyed NOT IN ('Yes', 'No', 'Unknown');

-- 5) Sanity check
SELECT surveyed, COUNT(*)
FROM settlement
GROUP BY surveyed
ORDER BY surveyed;

COMMIT;




//landuse 
BEGIN;

-- 1) Null/blank/junk -> Other
UPDATE settlement
SET landuse = 'Other'
WHERE landuse IS NULL
   OR btrim(landuse) = ''
   OR lower(btrim(landuse)) IN ('n/a', 'na', 'none', 'null', 'other')
   OR btrim(landuse) ~ '^[0-9]+$'
   OR lower(btrim(landuse)) IN ('tes');

-- 2) Normalize to controlled categories (comma-separated)
UPDATE settlement
SET landuse =
  NULLIF(
    trim(both ', ' FROM concat_ws(', ',

      -- Mixed: explicit "mixed" OR res+comm together (and/cum/slash)
      CASE WHEN (
           lower(landuse) LIKE '%mixed%'
        OR lower(landuse) LIKE '%cum%'
        OR (
             (lower(landuse) ~ 'resid' OR lower(landuse) LIKE '%presidential%')
          AND (lower(landuse) LIKE '%comm%' )
          AND (lower(landuse) LIKE '%and%' OR lower(landuse) LIKE '%/%' OR lower(landuse) LIKE '% %')
        )
      ) THEN 'Mixed' END,

      -- Only keep Residential/Commercial separately if NOT Mixed
      CASE WHEN NOT (
           lower(landuse) LIKE '%mixed%'
        OR lower(landuse) LIKE '%cum%'
        OR (
             (lower(landuse) ~ 'resid' OR lower(landuse) LIKE '%presidential%')
          AND (lower(landuse) LIKE '%comm%' )
        )
      ) AND (lower(landuse) ~ 'resid' OR lower(landuse) LIKE '%presidential%')
      THEN 'Residential' END,

      CASE WHEN NOT (
           lower(landuse) LIKE '%mixed%'
        OR lower(landuse) LIKE '%cum%'
        OR (
             (lower(landuse) ~ 'resid' OR lower(landuse) LIKE '%presidential%')
          AND (lower(landuse) LIKE '%comm%' )
        )
      ) AND lower(landuse) LIKE '%comm%'
      THEN 'Commercial' END,

      CASE WHEN lower(landuse) LIKE '%indust%' OR lower(landuse) LIKE '%ndustr%'
      THEN 'Industrial' END,

      CASE WHEN lower(landuse) LIKE '%educat%'
      THEN 'Educational' END,

      CASE WHEN lower(landuse) LIKE '%public purpose%' OR lower(landuse) LIKE '%public%purpose%'
      THEN 'Public Purpose' END,

      CASE WHEN lower(landuse) LIKE '%public util%' OR lower(landuse) LIKE '%public utl%'
      THEN 'Public Utility' END,

      CASE WHEN lower(landuse) LIKE '%transport%'
      THEN 'Transportation' END,

      CASE WHEN lower(landuse) LIKE '%agric%'
      THEN 'Agricultural' END,

      CASE WHEN lower(landuse) LIKE '%undevelop%'
      THEN 'Undeveloped' END,

      CASE WHEN lower(landuse) LIKE '%conserv%'
      THEN 'Conservation' END,

      -- If nothing matched, keep as Other
      CASE WHEN
        NOT (
          lower(landuse) LIKE '%mixed%' OR lower(landuse) LIKE '%cum%'
          OR lower(landuse) ~ 'resid' OR lower(landuse) LIKE '%presidential%'
          OR lower(landuse) LIKE '%comm%'
          OR lower(landuse) LIKE '%indust%' OR lower(landuse) LIKE '%ndustr%'
          OR lower(landuse) LIKE '%educat%'
          OR lower(landuse) LIKE '%public purpose%' OR lower(landuse) LIKE '%public%purpose%'
          OR lower(landuse) LIKE '%public util%' OR lower(landuse) LIKE '%public utl%'
          OR lower(landuse) LIKE '%transport%'
          OR lower(landuse) LIKE '%agric%'
          OR lower(landuse) LIKE '%undevelop%'
          OR lower(landuse) LIKE '%conserv%'
        )
      THEN 'Other' END

    )),
    ''
  );

-- 3) Sanity check: show remaining distinct values
SELECT landuse, COUNT(*)
FROM settlement
GROUP BY landuse
ORDER BY COUNT(*) DESC;

COMMIT;





/near_river
BEGIN;

-- 1) NULL -> FALSE
UPDATE settlement
SET near_river = FALSE
WHERE near_river IS NULL;

-- 2) Sanity check
SELECT near_river, COUNT(*)
FROM settlement
GROUP BY near_river;

COMMIT;



//on_wayleave	on_road_reserve


UPDATE settlement
SET on_wayleave = FALSE
WHERE on_wayleave IS NULL;

-- 2) Sanity check
SELECT on_wayleave, COUNT(*)
FROM settlement
GROUP BY on_wayleave;

COMMIT;



// on_road_reserve
UPDATE settlement
SET on_road_reserve = FALSE
WHERE on_road_reserve IS NULL;

-- 2) Sanity check
SELECT on_road_reserve, COUNT(*)
FROM settlement
GROUP BY on_road_reserve;

COMMIT;


// encumbrance

UPDATE settlement
SET encumbrance = FALSE
WHERE encumbrance IS NULL;

-- 2) Sanity check
SELECT encumbrance, COUNT(*)
FROM settlement
GROUP BY encumbrance ;

COMMIT;




//electricity_availability	piped_water_availability

UPDATE settlement
SET electricity_availability = FALSE
WHERE electricity_availability IS NULL;

-- 2) Sanity check
SELECT electricity_availability, COUNT(*)
FROM settlement
GROUP BY electricity_availability;

COMMIT;


//piped_water_availability


UPDATE settlement
SET piped_water_availability = FALSE
WHERE piped_water_availability IS NULL;

-- 2) Sanity check
SELECT piped_water_availability, COUNT(*)
FROM settlement
GROUP BY piped_water_availability;

COMMIT;



//structure_types 
BEGIN;

-- 1) Force NULL/junk -> Semi-permanent
UPDATE settlement
SET structure_types = 'Semi-permanent'
WHERE structure_types IS NULL
   OR btrim(structure_types) = ''
   OR lower(btrim(structure_types)) IN ('n/a', 'na', 'other', 'null');

-- 2) Normalize using regex-safe detection
WITH norm AS (
  SELECT
    id,
    -- clean to words only (handles commas, dots, underscores, brackets, counts, etc.)
    lower(regexp_replace(structure_types, '[^a-z]+', ' ', 'g')) AS cleaned
  FROM settlement
),
flags AS (
  SELECT
    id,
    cleaned,
    (cleaned ~ 'semi') AS has_semi,
    (cleaned ~ 'tempor|tempar') AS has_temp,
    (
      -- remove semi-permanent token(s), then look for permanent
      regexp_replace(cleaned, 'semi\s*perman\w*', ' ', 'g') ~ 'perman\w*'
    ) AS has_perm
  FROM norm
)
UPDATE settlement s
SET structure_types =
  trim(both ', ' FROM concat_ws(', ',
    CASE WHEN f.has_perm THEN 'Permanent' END,
    CASE WHEN f.has_semi THEN 'Semi-permanent' END,
    CASE WHEN f.has_temp THEN 'Temporary' END
  ))
FROM flags f
WHERE s.id = f.id;

-- 3) Any weird leftovers -> Semi-permanent
UPDATE settlement
SET structure_types = 'Semi-permanent'
WHERE structure_types IS NULL
   OR btrim(structure_types) = ''
   OR structure_types NOT IN (
     'Permanent',
     'Semi-permanent',
     'Temporary',
     'Permanent, Semi-permanent',
     'Permanent, Temporary',
     'Semi-permanent, Temporary',
     'Permanent, Semi-permanent, Temporary'
   );

-- 4) Check
SELECT structure_types, COUNT(*)
FROM settlement
GROUP BY structure_types
ORDER BY COUNT(*) DESC;

COMMIT;



//typical_building_materials 
BEGIN;

-- 1) NULL / blank / N/A -> Other
UPDATE settlement
SET typical_building_materials = 'Other'
WHERE typical_building_materials IS NULL
   OR btrim(typical_building_materials) = ''
   OR lower(btrim(typical_building_materials)) IN ('n/a', 'na', 'none', 'null');

-- 2) Normalize to controlled materials list
WITH norm AS (
  SELECT
    id,
    lower(regexp_replace(typical_building_materials, '[^a-z]+', ' ', 'g')) AS t
  FROM settlement
),
parsed AS (
  SELECT
    id,
    trim(both ', ' FROM concat_ws(', ',

      CASE WHEN t ~ '(blocks|block|stone|brick)' THEN 'Stone/Blocks' END,
      CASE WHEN t ~ '(mud)' THEN 'Mud' END,
      CASE WHEN t ~ '(timber|wood|wooden)' THEN 'Timber/Wood' END,
      CASE WHEN t ~ '(iron\s*sheets?|ironsheets?)' THEN 'Iron sheets' END,
      CASE WHEN t ~ '(earth|soil)' THEN 'Earth' END,
      CASE WHEN t ~ '(cement|cemeneted|cemented)' THEN 'Cement' END,
      CASE WHEN t ~ '(tile|tiles|tiled)' THEN 'Tiles' END,
      CASE WHEN t ~ '(grass)' THEN 'Grass' END,
      CASE WHEN t ~ '(plastic|polythene|polytene|carton)' THEN 'Plastic/Polythene' END,
      CASE WHEN t ~ '(concrete|slab)' THEN 'Concrete/Slab' END,
      CASE WHEN t ~ '(terrazzo)' THEN 'Terrazzo' END

    )) AS cleaned_list
  FROM norm
)
UPDATE settlement s
SET typical_building_materials =
  CASE
    WHEN p.cleaned_list IS NULL OR p.cleaned_list = '' THEN 'Other'
    ELSE p.cleaned_list
  END
FROM parsed p
WHERE s.id = p.id;

-- 3) Sanity check
SELECT typical_building_materials, COUNT(*)
FROM settlement
GROUP BY typical_building_materials
ORDER BY COUNT(*) DESC;

COMMIT;



// land_status
BEGIN;

-- 1) NULL/blank + non-status admin values -> Unknown
UPDATE settlement
SET land_status = 'Unknown'
WHERE land_status IS NULL
   OR btrim(land_status) = ''
   OR lower(btrim(land_status)) IN (
     'unknown','unkwn','n/a','na','null',
     'occupied','public land','unregistered'
   );

-- 2) Partly/Partially planned & surveyed -> Planned, Surveyed
UPDATE settlement
SET land_status = 'Planned, Surveyed'
WHERE lower(land_status) LIKE '%partly%'
   OR lower(land_status) LIKE '%partially%';

-- 3) Planned + Surveyed (any separator/order) -> Planned, Surveyed
UPDATE settlement
SET land_status = 'Planned, Surveyed'
WHERE lower(land_status) LIKE '%planned%'
  AND lower(land_status) LIKE '%surveyed%';

-- 4) Surveyed alone -> Planned, Surveyed (your rule)
UPDATE settlement
SET land_status = 'Planned, Surveyed'
WHERE lower(btrim(land_status)) = 'surveyed';

-- 5) Planned + Unsurveyed -> Planned, Unsurveyed
UPDATE settlement
SET land_status = 'Planned, Unsurveyed'
WHERE lower(land_status) LIKE '%planned%'
  AND lower(land_status) LIKE '%unsurveyed%';

-- 6) Unplanned + Surveyed -> Unplanned, Surveyed
UPDATE settlement
SET land_status = 'Unplanned, Surveyed'
WHERE lower(land_status) LIKE '%unplanned%'
  AND lower(land_status) LIKE '%surveyed%';

-- 7) Any Unplanned/Unsurveyed leftover -> Unplanned, Unsurveyed
UPDATE settlement
SET land_status = 'Unplanned, Unsurveyed'
WHERE lower(land_status) LIKE '%unplanned%'
   OR lower(land_status) LIKE '%unsurveyed%';

-- 8) Planned only -> Planned, Unsurveyed
UPDATE settlement
SET land_status = 'Planned, Unsurveyed'
WHERE lower(btrim(land_status)) = 'planned';

-- 9) Unplanned only -> Unplanned, Unsurveyed
UPDATE settlement
SET land_status = 'Unplanned, Unsurveyed'
WHERE lower(btrim(land_status)) = 'unplanned';

-- 10) Final safety net: anything else -> Unknown
UPDATE settlement
SET land_status = 'Unknown'
WHERE land_status NOT IN (
  'Unknown',
  'Planned, Surveyed',
  'Planned, Unsurveyed',
  'Unplanned, Surveyed',
  'Unplanned, Unsurveyed'
);

-- 11) Check results
SELECT land_status, COUNT(*)
FROM settlement
GROUP BY land_status
ORDER BY COUNT(*) DESC;

COMMIT;



BEGIN;

-- Goal: normalize parcel_owner_type to ONLY:
-- Unknown, Private, Public, Communal, Mixed

-- 1) NULL / blank / N-A / free-text unknowns -> Unknown
UPDATE settlement
SET parcel_owner_type = 'Unknown'
WHERE parcel_owner_type IS NULL
   OR btrim(parcel_owner_type) = ''
   OR lower(btrim(parcel_owner_type)) IN ('n/a','na','null','unknown','other')
   OR lower(parcel_owner_type) LIKE '%unknown%';

-- 2) Clean obvious typos for Public Land wording (optional but helps)
UPDATE settlement
SET parcel_owner_type = regexp_replace(parcel_owner_type, 'Unconteested', 'Uncontested', 'gi');

-- 3) Any record mentioning multiple ownership types -> Mixed
UPDATE settlement
SET parcel_owner_type = 'Mixed'
WHERE lower(parcel_owner_type) LIKE '%private%'
  AND (lower(parcel_owner_type) LIKE '%public%'
       OR lower(parcel_owner_type) LIKE '%government%'
       OR lower(parcel_owner_type) LIKE '%communal%');

UPDATE settlement
SET parcel_owner_type = 'Mixed'
WHERE lower(parcel_owner_type) LIKE '%public%'
  AND (lower(parcel_owner_type) LIKE '%communal%');

UPDATE settlement
SET parcel_owner_type = 'Mixed'
WHERE lower(parcel_owner_type) LIKE '%partly%'
   OR lower(parcel_owner_type) LIKE '%and%'
   OR lower(parcel_owner_type) LIKE '%,%';

-- 4) Public (includes government / public land statements)
UPDATE settlement
SET parcel_owner_type = 'Public'
WHERE parcel_owner_type NOT IN ('Unknown','Mixed')
  AND (
       lower(parcel_owner_type) LIKE '%public%'
    OR lower(parcel_owner_type) LIKE '%government%'
    OR lower(parcel_owner_type) LIKE '%uncontested public land%'
    OR lower(parcel_owner_type) LIKE '%public land%'
  );

-- 5) Communal
UPDATE settlement
SET parcel_owner_type = 'Communal'
WHERE parcel_owner_type NOT IN ('Unknown','Mixed','Public')
  AND lower(parcel_owner_type) LIKE '%communal%';

-- 6) Private (includes individual / landlords / church / named people)
UPDATE settlement
SET parcel_owner_type = 'Private'
WHERE parcel_owner_type NOT IN ('Unknown','Mixed','Public','Communal')
  AND (
       lower(parcel_owner_type) LIKE '%private%'
    OR lower(parcel_owner_type) LIKE '%individual%'
    OR lower(parcel_owner_type) LIKE '%landlord%'
    OR lower(parcel_owner_type) LIKE '%church%'
    OR lower(parcel_owner_type) LIKE '%catholic%'
    OR lower(parcel_owner_type) LIKE '%john doe%'
    OR lower(parcel_owner_type) LIKE '%italian%'
  );

-- 7) Final safety net: anything else -> Unknown
UPDATE settlement
SET parcel_owner_type = 'Unknown'
WHERE parcel_owner_type NOT IN ('Unknown','Private','Public','Communal','Mixed');

-- 8) Check
SELECT parcel_owner_type, COUNT(*)
FROM settlement
GROUP BY parcel_owner_type
ORDER BY COUNT(*) DESC;

COMMIT;


-- Clean household gender
BEGIN;
UPDATE households
SET gender = 'Male'
WHERE gender IS NOT NULL
  AND btrim(gender) <> ''
  AND (
       lower(btrim(gender)) IN ('male', 'm', '1')
    OR lower(gender) LIKE 'male%'
  );

UPDATE grievance
SET gender = 'Female'
WHERE gender IS NOT NULL
  AND btrim(gender) <> ''
  AND (
       lower(btrim(gender)) IN ('female', 'f', '2')
    OR lower(gender) LIKE 'female%'
  );

UPDATE grievance
SET gender = 'Unknown'
WHERE gender IS NULL
   OR btrim(gender) = ''
   OR lower(btrim(gender)) IN ('n/a', 'na', 'unknown', 'other', '-');

SELECT gender, COUNT(*)
FROM grievance
GROUP BY gender
ORDER BY COUNT(*) DESC;
COMMIT;


SELECT
  SUM(ST_Length(ST_Transform(geom, 21036)))/1000  AS total_roads_km
FROM road;
