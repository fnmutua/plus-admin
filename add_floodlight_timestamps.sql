 ALTER TABLE floodlight 
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

 CREATE INDEX IF NOT EXISTS idx_floodlight_createdAt ON floodlight("createdAt");

 CREATE INDEX IF NOT EXISTS idx_floodlight_updatedAt ON floodlight("updatedAt");

 UPDATE floodlight 
SET "createdAt" = CURRENT_TIMESTAMP 
WHERE "createdAt" IS NULL;

UPDATE floodlight 
SET "updatedAt" = CURRENT_TIMESTAMP 
WHERE "updatedAt" IS NULL;

