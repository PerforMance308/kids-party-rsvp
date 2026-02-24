-- Add detailed location storage for map usage while keeping city-level display location
ALTER TABLE "parties"
ADD COLUMN "location_full" TEXT;
