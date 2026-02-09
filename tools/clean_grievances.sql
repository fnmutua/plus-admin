UPDATE grievance
SET gender = CASE
    -- Male variants
    WHEN LOWER(TRIM(gender)) IN ('male', 'm') THEN 'Male'

    -- Female variants
    WHEN LOWER(TRIM(gender)) IN ('female', 'f') THEN 'Female'
 
    -- Not available / unspecified variants
    WHEN gender IS NULL
      OR LOWER(TRIM(gender)) IN (
          'n/a',
          'na',
          'Other'
          'not available',
          'unspecified',
          'unknown'
      ) THEN 'Not Available'

    -- Catch-all (anything weird)
    ELSE 'Not Available'
END;
