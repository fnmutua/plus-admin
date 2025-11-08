 ALTER TABLE hazard_zone 
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

 CREATE INDEX IF NOT EXISTS idx_hazard_zone_createdAt ON hazard_zone("createdAt");

 CREATE INDEX IF NOT EXISTS idx_hazard_zone_updatedAt ON hazard_zone("updatedAt");

 UPDATE hazard_zone 
SET "createdAt" = CURRENT_TIMESTAMP 
WHERE "createdAt" IS NULL;

UPDATE hazard_zone 
SET "updatedAt" = CURRENT_TIMESTAMP 
WHERE "updatedAt" IS NULL;



@dmin!@K#sM1S*20@3