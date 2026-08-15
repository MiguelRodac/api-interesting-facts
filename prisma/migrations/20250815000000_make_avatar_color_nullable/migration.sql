-- Migration: make avatar_options.color nullable
-- Run: npx prisma migrate deploy

ALTER TABLE "avatar_options" ALTER COLUMN "color" DROP NOT NULL;
