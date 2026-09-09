-- CreateIndex
CREATE INDEX IF NOT EXISTS "idx_facts_created_at_desc" ON "facts"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_reposts_created_at_desc" ON "reposts"("created_at" DESC);

-- CreateView
CREATE OR REPLACE VIEW "view_facts_repost_pagination" AS
SELECT 
  id,
  'fact' AS type,
  id AS original_fact_id,
  author_id,
  created_at
FROM facts
UNION ALL
SELECT 
  id,
  'repost' AS type,
  original_fact_id,
  author_id,
  created_at
FROM reposts;
