-- CreateTable
CREATE TABLE "public"."comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "fact_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "parent_comment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comments_fact_id_created_at_idx" ON "public"."comments"("fact_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "comments_author_id_created_at_idx" ON "public"."comments"("author_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "comments_top_level_idx" ON "public"."comments"("fact_id", "created_at" DESC) WHERE "parent_comment_id" IS NULL;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_fact_id_fkey" FOREIGN KEY ("fact_id") REFERENCES "public"."facts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("firebase_uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
