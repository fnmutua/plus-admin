-- SQL script to add createdAt and updatedAt timestamp fields to railway table
-- Run this script on your PostgreSQL database

-- Add createdAt column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'railway' AND column_name = 'createdAt'
    ) THEN
        ALTER TABLE railway ADD COLUMN "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added createdAt column to railway table';
    ELSE
        RAISE NOTICE 'railway table already has createdAt column';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'railway' AND column_name = 'updatedAt'
    ) THEN
        ALTER TABLE railway ADD COLUMN "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updatedAt column to railway table';
    ELSE
        RAISE NOTICE 'railway table already has updatedAt column';
    END IF;
END $$;

-- Alternative: Simple ALTER TABLE statements (run if DO block doesn't work)
-- Uncomment and run these if needed:

/*
-- Check if columns exist first:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'railway' 
AND column_name IN ('createdAt', 'updatedAt');

-- Add createdAt column
ALTER TABLE railway ADD COLUMN "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add updatedAt column
ALTER TABLE railway ADD COLUMN "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to have current timestamp (optional, if you want to set values for existing records)
UPDATE railway SET "createdAt" = CURRENT_TIMESTAMP WHERE "createdAt" IS NULL;
UPDATE railway SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
*/

-- Create a trigger to automatically update updatedAt on row updates (optional but recommended)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS update_railway_updated_at ON railway;
CREATE TRIGGER update_railway_updated_at
    BEFORE UPDATE ON railway
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
