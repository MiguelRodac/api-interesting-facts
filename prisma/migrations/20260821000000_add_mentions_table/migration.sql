-- CreateTable
CREATE TABLE "public"."mentions" (
    "id" TEXT NOT NULL,
    "fact_id" TEXT,
    "comment_id" TEXT,
    "author_id" TEXT NOT NULL,
    "mentioned_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mentions_mentioned_user_id_created_at_idx" ON "public"."mentions"("mentioned_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "mentions_author_id_created_at_idx" ON "public"."mentions"("author_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "public"."mentions" ADD CONSTRAINT "mentions_fact_id_fkey" FOREIGN KEY ("fact_id") REFERENCES "public"."facts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mentions" ADD CONSTRAINT "mentions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mentions" ADD CONSTRAINT "mentions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("firebase_uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mentions" ADD CONSTRAINT "mentions_mentioned_user_id_fkey" FOREIGN KEY ("mentioned_user_id") REFERENCES "public"."users"("firebase_uid") ON DELETE CASCADE ON UPDATE CASCADE;
