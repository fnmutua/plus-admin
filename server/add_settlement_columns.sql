-- Add missing columns to public.settlement (run in psql or any PostgreSQL client)
-- Safe to run: each block skips if the column already exists.

-- 1. profiling_status (required for GROUP BY in filters)
ALTER TABLE public.settlement
  ADD COLUMN IF NOT EXISTS profiling_status VARCHAR(255) NOT NULL DEFAULT 'NOT_PROFILED';

COMMENT ON COLUMN public.settlement.profiling_status IS 'Profiling status: NOT_PROFILED, PARTIALLY_PROFILED, PROFILED';

-- 2. is_qualified
ALTER TABLE public.settlement
  ADD COLUMN IF NOT EXISTS is_qualified BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.settlement.is_qualified IS 'Whether settlement meets slum/informal threshold when profiled';

-- 3. isApproved (in case missing)
ALTER TABLE public.settlement
  ADD COLUMN IF NOT EXISTS "isApproved" VARCHAR(255) DEFAULT 'Pending';

-- 4. isActive (in case missing)
ALTER TABLE public.settlement
  ADD COLUMN IF NOT EXISTS "isActive" VARCHAR(255) DEFAULT 'true';
