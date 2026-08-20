-- CreateIndex
CREATE INDEX "comments_parent_comment_id_author_id_idx" ON "comments"("parent_comment_id", "author_id");