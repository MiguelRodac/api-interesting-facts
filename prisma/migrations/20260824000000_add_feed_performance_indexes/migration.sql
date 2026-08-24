-- CreateIndex
CREATE INDEX "likes_fact_id_user_id_idx" ON "likes"("fact_id", "user_id");

-- CreateIndex
CREATE INDEX "comments_fact_id_parent_comment_id_created_at_idx" ON "comments"("fact_id", "parent_comment_id", "created_at" DESC);
