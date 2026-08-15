-- Make avatar_options.color nullable
-- Color is now optional: alohe avatars have url but no color (user picks color),
-- standalone color entries have color but no url.
ALTER TABLE "avatar_options" ALTER COLUMN "color" DROP NOT NULL;
