-- Migration: make avatar_options.color nullable + seed 155 avatar options
-- Run: npx prisma migrate deploy

-- Step 1: Make color nullable
ALTER TABLE "avatar_options" ALTER COLUMN "color" DROP NOT NULL;

-- Step 2: Clear and seed avatar options
TRUNCATE "avatar_options" RESTART IDENTITY CASCADE;

-- vibrent (1-27) - Purple/Indigo
INSERT INTO "avatar_options" ("id", "url", "color", "created_at") VALUES
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_1.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_2.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_3.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_4.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_5.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_6.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_7.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_8.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_9.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_10.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_11.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_12.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_13.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_14.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_15.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_16.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_17.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_18.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_19.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_20.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_21.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_22.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_23.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_24.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_25.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_26.png', '#6366f1', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_27.png', '#6366f1', NOW());

-- 3d (1-5) - Violet
INSERT INTO "avatar_options" ("id", "url", "color", "created_at") VALUES
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/3d_1.png', '#8b5cf6', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/3d_2.png', '#8b5cf6', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/3d_3.png', '#8b5cf6', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/3d_4.png', '#8b5cf6', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/3d_5.png', '#8b5cf6', NOW());

-- bluey (1-10) - Blue
INSERT INTO "avatar_options" ("id", "url", "color", "created_at") VALUES
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_1.png', '#3b82f6', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_2.png', '#3b82f6', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_3.png', '#3b82f6', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_4.png', '#3b82f6', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_5.png', '#3b82f6', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_6.png', '#3b82f6', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_7.png', '#3b82f6', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_8.png', '#3b82f6', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_9.png', '#3b82f6', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_10.png', '#3b82f6', NOW());

-- memo (1-35) - Amber
INSERT INTO "avatar_options" ("id", "url", "color", "created_at") VALUES
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_1.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_2.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_3.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_4.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_5.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_6.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_7.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_8.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_9.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_10.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_11.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_12.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_13.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_14.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_15.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_16.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_17.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_18.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_19.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_20.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_21.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_22.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_23.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_24.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_25.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_26.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_27.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_28.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_29.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_30.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_31.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_32.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_33.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_34.png', '#f59e0b', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_35.png', '#f59e0b', NOW());

-- notion (1-15) - Dark/Gray
INSERT INTO "avatar_options" ("id", "url", "color", "created_at") VALUES
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_1.png', '#1f2937', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_2.png', '#1f2937', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_3.png', '#1f2937', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_4.png', '#1f2937', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_5.png', '#1f2937', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_6.png', '#1f2937', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_7.png', '#1f2937', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_8.png', '#1f2937', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_9.png', '#1f2937', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_10.png', '#1f2937', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_11.png', '#1f2937', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_12.png', '#1f2937', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_13.png', '#1f2937', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_14.png', '#1f2937', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_15.png', '#1f2937', NOW());

-- teams (1-9) - Steel
INSERT INTO "avatar_options" ("id", "url", "color", "created_at") VALUES
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/teams_1.png', '#506e89', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/teams_2.png', '#506e89', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/teams_3.png', '#506e89', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/teams_4.png', '#506e89', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/teams_5.png', '#506e89', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/teams_6.png', '#506e89', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/teams_7.png', '#506e89', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/teams_8.png', '#506e89', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/teams_9.png', '#506e89', NOW());

-- toon (1-10) - Pink
INSERT INTO "avatar_options" ("id", "url", "color", "created_at") VALUES
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_1.png', '#ec4899', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_2.png', '#ec4899', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_3.png', '#ec4899', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_4.png', '#ec4899', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_5.png', '#ec4899', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_6.png', '#ec4899', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_7.png', '#ec4899', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_8.png', '#ec4899', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_9.png', '#ec4899', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_10.png', '#ec4899', NOW());

-- upstream (1-22) - Emerald
INSERT INTO "avatar_options" ("id", "url", "color", "created_at") VALUES
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_1.png', '#10b981', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_2.png', '#10b981', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_3.png', '#10b981', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_4.png', '#10b981', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_5.png', '#10b981', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_6.png', '#10b981', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_7.png', '#10b981', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_8.png', '#10b981', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_9.png', '#10b981', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_10.png', '#10b981', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_11.png', '#10b981', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_12.png', '#10b981', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_13.png', '#10b981', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_14.png', '#10b981', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_15.png', '#10b981', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_16.png', '#10b981', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_17.png', '#10b981', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_18.png', '#10b981', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_19.png', '#10b981', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_20.png', '#10b981', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_21.png', '#10b981', NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_22.png', '#10b981', NOW());

-- Standalone color swatches (no url)
INSERT INTO "avatar_options" ("id", "url", "color", "created_at") VALUES
(gen_random_uuid(), NULL, '#ef4444', NOW()),
(gen_random_uuid(), NULL, '#f97316', NOW()),
(gen_random_uuid(), NULL, '#f59e0b', NOW()),
(gen_random_uuid(), NULL, '#eab308', NOW()),
(gen_random_uuid(), NULL, '#84cc16', NOW()),
(gen_random_uuid(), NULL, '#22c55e', NOW()),
(gen_random_uuid(), NULL, '#10b981', NOW()),
(gen_random_uuid(), NULL, '#14b8a6', NOW()),
(gen_random_uuid(), NULL, '#06b6d4', NOW()),
(gen_random_uuid(), NULL, '#0ea5e9', NOW()),
(gen_random_uuid(), NULL, '#3b82f6', NOW()),
(gen_random_uuid(), NULL, '#6366f1', NOW()),
(gen_random_uuid(), NULL, '#8b5cf6', NOW()),
(gen_random_uuid(), NULL, '#a855f7', NOW()),
(gen_random_uuid(), NULL, '#d946ef', NOW()),
(gen_random_uuid(), NULL, '#ec4899', NOW()),
(gen_random_uuid(), NULL, '#f43f5e', NOW()),
(gen_random_uuid(), NULL, '#78716c', NOW()),
(gen_random_uuid(), NULL, '#71717a', NOW()),
(gen_random_uuid(), NULL, '#64748b', NOW()),
(gen_random_uuid(), NULL, '#1f2937', NOW()),
(gen_random_uuid(), NULL, '#111827', NOW());
