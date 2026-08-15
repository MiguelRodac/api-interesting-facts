-- Migration: make avatar_options.color nullable + seed 157 avatar options
-- Run: npx prisma migrate deploy

-- Step 1: Make color nullable
ALTER TABLE "avatar_options" ALTER COLUMN "color" DROP NOT NULL;

-- Step 2: Clear and seed avatar options
TRUNCATE "avatar_options" RESTART IDENTITY CASCADE;

-- =============================================
-- ALOHE/AVATARS CATALOG (built-in options)
-- =============================================

-- vibrent (1-27)
INSERT INTO "avatar_options" ("id", "url", "color", "created_at") VALUES
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_1.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_2.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_3.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_4.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_5.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_6.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_7.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_8.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_9.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_10.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_11.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_12.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_13.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_14.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_15.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_16.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_17.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_18.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_19.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_20.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_21.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_22.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_23.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_24.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_25.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_26.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/vibrent_27.png', NULL, NOW());

-- 3d (1-5)
INSERT INTO "avatar_options" ("id", "url", "color", "created_at") VALUES
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/3d_1.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/3d_2.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/3d_3.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/3d_4.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/3d_5.png', NULL, NOW());

-- bluey (1-10)
INSERT INTO "avatar_options" ("id", "url", "color", "created_at") VALUES
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_1.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_2.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_3.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_4.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_5.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_6.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_7.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_8.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_9.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/bluey_10.png', NULL, NOW());

-- memo (1-35)
INSERT INTO "avatar_options" ("id", "url", "color", "created_at") VALUES
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_1.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_2.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_3.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_4.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_5.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_6.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_7.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_8.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_9.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_10.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_11.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_12.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_13.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_14.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_15.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_16.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_17.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_18.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_19.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_20.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_21.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_22.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_23.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_24.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_25.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_26.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_27.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_28.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_29.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_30.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_31.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_32.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_33.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_34.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_35.png', NULL, NOW());

-- notion (1-15)
INSERT INTO "avatar_options" ("id", "url", "color", "created_at") VALUES
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_1.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_2.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_3.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_4.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_5.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_6.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_7.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_8.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_9.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_10.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_11.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_12.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_13.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_14.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/notion_15.png', NULL, NOW());

-- teams (1-9)
INSERT INTO "avatar_options" ("id", "url", "color", "created_at") VALUES
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/teams_1.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/teams_2.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/teams_3.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/teams_4.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/teams_5.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/teams_6.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/teams_7.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/teams_8.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/teams_9.png', NULL, NOW());

-- toon (1-10)
INSERT INTO "avatar_options" ("id", "url", "color", "created_at") VALUES
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_1.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_2.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_3.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_4.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_5.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_6.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_7.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_8.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_9.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/toon_10.png', NULL, NOW());

-- upstream (1-22)
INSERT INTO "avatar_options" ("id", "url", "color", "created_at") VALUES
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_1.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_2.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_3.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_4.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_5.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_6.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_7.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_8.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_9.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_10.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_11.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_12.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_13.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_14.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_15.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_16.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_17.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_18.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_19.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_20.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_21.png', NULL, NOW()),
(gen_random_uuid(), 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/upstream_22.png', NULL, NOW());

-- =============================================
-- STANDALONE COLOR PALETTE (url NULL, color set)
-- =============================================

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
(gen_random_uuid(), NULL, '#111827', NOW()),
(gen_random_uuid(), NULL, '#506e89', NOW()),
(gen_random_uuid(), NULL, '#f59e0b', NOW());
