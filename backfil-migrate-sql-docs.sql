-- Backfill document_link from existing document records
INSERT INTO public.document_link (document_id, entity_type, entity_id, "createdAt", "updatedAt")
SELECT id, 'settlement',        settlement_id,        NOW(), NOW() FROM public.document WHERE settlement_id        IS NOT NULL
UNION ALL
SELECT id, 'project',           project_id,           NOW(), NOW() FROM public.document WHERE project_id           IS NOT NULL
UNION ALL
SELECT id, 'health_facility',   health_facility_id,   NOW(), NOW() FROM public.document WHERE health_facility_id   IS NOT NULL
UNION ALL
SELECT id, 'education_facility',education_facility_id,NOW(), NOW() FROM public.document WHERE education_facility_id IS NOT NULL
UNION ALL
SELECT id, 'road',              road_id,              NOW(), NOW() FROM public.document WHERE road_id              IS NOT NULL
UNION ALL
SELECT id, 'road_asset',        road_asset_id,        NOW(), NOW() FROM public.document WHERE road_asset_id        IS NOT NULL
UNION ALL
SELECT id, 'water_point',       water_point_id,       NOW(), NOW() FROM public.document WHERE water_point_id       IS NOT NULL
UNION ALL
SELECT id, 'sewer',             sewer_id,             NOW(), NOW() FROM public.document WHERE sewer_id             IS NOT NULL
UNION ALL
SELECT id, 'other_facility',    other_facility_id,    NOW(), NOW() FROM public.document WHERE other_facility_id    IS NOT NULL
UNION ALL
SELECT id, 'contractor',        contractor_id,        NOW(), NOW() FROM public.document WHERE contractor_id        IS NOT NULL
ON CONFLICT (document_id, entity_type, entity_id) DO NOTHING;
