-- Fix multi-settlement / duplicate-name document linking
-- Problem: batch upload matched (name + location), so same logical file became many
-- document rows (same name, different settlement_id). UI only shows one row's links.
--
-- Strategy: For each document NAME with multiple rows, pick canonical row = MIN(id).
-- Copy every FK (settlement, project, facilities, etc.) from ALL rows with that name
-- into document_link on the canonical document_id. Idempotent (ON CONFLICT DO NOTHING).
--
-- Run in psql after backup:
--   psql -U postgres -d YOUR_DB -f fix_duplicate_document_links.sql
--
-- Optional cleanup of duplicate document ROWS is at the bottom (commented). Only run
-- after verifying links and that nothing else references those document ids.

BEGIN;

-- 1) Preview: names with more than one document row
-- SELECT name, COUNT(*) AS cnt, MIN(id) AS keeper_id, array_agg(id ORDER BY id) AS all_ids
-- FROM public.document
-- GROUP BY name
-- HAVING COUNT(*) > 1
-- ORDER BY cnt DESC;

-- 2) Merge all settlement links onto keeper (one row per name = MIN(id))
WITH keeper AS (
  SELECT name, MIN(id) AS keeper_id
  FROM public.document
  GROUP BY name
  HAVING COUNT(*) > 1
)
INSERT INTO public.document_link (document_id, entity_type, entity_id, "createdAt", "updatedAt")
SELECT k.keeper_id, 'settlement', o.settlement_id, NOW(), NOW()
FROM keeper k
JOIN public.document o ON o.name = k.name
WHERE o.settlement_id IS NOT NULL
ON CONFLICT (document_id, entity_type, entity_id) DO NOTHING;

WITH keeper AS (
  SELECT name, MIN(id) AS keeper_id
  FROM public.document
  GROUP BY name
  HAVING COUNT(*) > 1
)
INSERT INTO public.document_link (document_id, entity_type, entity_id, "createdAt", "updatedAt")
SELECT k.keeper_id, 'project', o.project_id, NOW(), NOW()
FROM keeper k
JOIN public.document o ON o.name = k.name
WHERE o.project_id IS NOT NULL
ON CONFLICT (document_id, entity_type, entity_id) DO NOTHING;

WITH keeper AS (
  SELECT name, MIN(id) AS keeper_id
  FROM public.document
  GROUP BY name
  HAVING COUNT(*) > 1
)
INSERT INTO public.document_link (document_id, entity_type, entity_id, "createdAt", "updatedAt")
SELECT k.keeper_id, 'health_facility', o.health_facility_id, NOW(), NOW()
FROM keeper k
JOIN public.document o ON o.name = k.name
WHERE o.health_facility_id IS NOT NULL
ON CONFLICT (document_id, entity_type, entity_id) DO NOTHING;

WITH keeper AS (
  SELECT name, MIN(id) AS keeper_id
  FROM public.document
  GROUP BY name
  HAVING COUNT(*) > 1
)
INSERT INTO public.document_link (document_id, entity_type, entity_id, "createdAt", "updatedAt")
SELECT k.keeper_id, 'education_facility', o.education_facility_id, NOW(), NOW()
FROM keeper k
JOIN public.document o ON o.name = k.name
WHERE o.education_facility_id IS NOT NULL
ON CONFLICT (document_id, entity_type, entity_id) DO NOTHING;

WITH keeper AS (
  SELECT name, MIN(id) AS keeper_id
  FROM public.document
  GROUP BY name
  HAVING COUNT(*) > 1
)
INSERT INTO public.document_link (document_id, entity_type, entity_id, "createdAt", "updatedAt")
SELECT k.keeper_id, 'road', o.road_id, NOW(), NOW()
FROM keeper k
JOIN public.document o ON o.name = k.name
WHERE o.road_id IS NOT NULL
ON CONFLICT (document_id, entity_type, entity_id) DO NOTHING;

WITH keeper AS (
  SELECT name, MIN(id) AS keeper_id
  FROM public.document
  GROUP BY name
  HAVING COUNT(*) > 1
)
INSERT INTO public.document_link (document_id, entity_type, entity_id, "createdAt", "updatedAt")
SELECT k.keeper_id, 'road_asset', o.road_asset_id, NOW(), NOW()
FROM keeper k
JOIN public.document o ON o.name = k.name
WHERE o.road_asset_id IS NOT NULL
ON CONFLICT (document_id, entity_type, entity_id) DO NOTHING;

WITH keeper AS (
  SELECT name, MIN(id) AS keeper_id
  FROM public.document
  GROUP BY name
  HAVING COUNT(*) > 1
)
INSERT INTO public.document_link (document_id, entity_type, entity_id, "createdAt", "updatedAt")
SELECT k.keeper_id, 'water_point', o.water_point_id, NOW(), NOW()
FROM keeper k
JOIN public.document o ON o.name = k.name
WHERE o.water_point_id IS NOT NULL
ON CONFLICT (document_id, entity_type, entity_id) DO NOTHING;

WITH keeper AS (
  SELECT name, MIN(id) AS keeper_id
  FROM public.document
  GROUP BY name
  HAVING COUNT(*) > 1
)
INSERT INTO public.document_link (document_id, entity_type, entity_id, "createdAt", "updatedAt")
SELECT k.keeper_id, 'sewer', o.sewer_id, NOW(), NOW()
FROM keeper k
JOIN public.document o ON o.name = k.name
WHERE o.sewer_id IS NOT NULL
ON CONFLICT (document_id, entity_type, entity_id) DO NOTHING;

WITH keeper AS (
  SELECT name, MIN(id) AS keeper_id
  FROM public.document
  GROUP BY name
  HAVING COUNT(*) > 1
)
INSERT INTO public.document_link (document_id, entity_type, entity_id, "createdAt", "updatedAt")
SELECT k.keeper_id, 'other_facility', o.other_facility_id, NOW(), NOW()
FROM keeper k
JOIN public.document o ON o.name = k.name
WHERE o.other_facility_id IS NOT NULL
ON CONFLICT (document_id, entity_type, entity_id) DO NOTHING;

WITH keeper AS (
  SELECT name, MIN(id) AS keeper_id
  FROM public.document
  GROUP BY name
  HAVING COUNT(*) > 1
)
INSERT INTO public.document_link (document_id, entity_type, entity_id, "createdAt", "updatedAt")
SELECT k.keeper_id, 'contractor', o.contractor_id, NOW(), NOW()
FROM keeper k
JOIN public.document o ON o.name = k.name
WHERE o.contractor_id IS NOT NULL
ON CONFLICT (document_id, entity_type, entity_id) DO NOTHING;

COMMIT;

-- ---------------------------------------------------------------------------
-- OPTIONAL: remove duplicate document rows (same name), keep MIN(id) only.
-- Uncomment only after you confirm the app lists documents by name or only uses
-- keeper rows + document_link. Check for FKs to document.id first.
--
-- BEGIN;
-- DELETE FROM public.document_link
-- WHERE document_id IN (
--   SELECT d.id
--   FROM public.document d
--   INNER JOIN (
--     SELECT name, MIN(id) AS keeper_id
--     FROM public.document
--     GROUP BY name
--     HAVING COUNT(*) > 1
--   ) k ON d.name = k.name AND d.id <> k.keeper_id
-- );
-- DELETE FROM public.document d
-- USING (
--   SELECT name, MIN(id) AS keeper_id
--   FROM public.document
--   GROUP BY name
--   HAVING COUNT(*) > 1
-- ) k
-- WHERE d.name = k.name AND d.id <> k.keeper_id;
-- COMMIT;
