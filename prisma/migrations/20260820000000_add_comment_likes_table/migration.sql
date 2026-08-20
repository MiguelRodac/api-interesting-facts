-- CreateTable
CREATE TABLE "public"."comment_likes" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comment_likes_comment_id_user_id_key" ON "public"."comment_likes"("comment_id", "user_id");

-- CreateIndex
CREATE INDEX "comment_likes_comment_id_created_at_idx" ON "public"."comment_likes"("comment_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "comment_likes_user_id_created_at_idx" ON "public"."comment_likes"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "public"."comment_likes" ADD CONSTRAINT "comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comment_likes" ADD CONSTRAINT "comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("firebase_uid") ON DELETE CASCADE ON UPDATE CASCADE;
