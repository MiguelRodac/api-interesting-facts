-- AlterTable: Make fact_id nullable, add repost_id
ALTER TABLE "public"."likes" ALTER COLUMN "fact_id" DROP NOT NULL;
ALTER TABLE "public"."likes" ADD COLUMN "repost_id" TEXT;

-- AlterTable: Make fact_id nullable, add repost_id
ALTER TABLE "public"."comments" ALTER COLUMN "fact_id" DROP NOT NULL;
ALTER TABLE "public"."comments" ADD COLUMN "repost_id" TEXT;

-- DropIndex: Remove old unique constraint (userId_factId)
DROP INDEX IF EXISTS "public"."likes_userId_factId_key";

-- CreateIndex
CREATE INDEX "likes_repost_id_idx" ON "public"."likes"("repost_id");

-- CreateIndex
CREATE INDEX "comments_repost_id_created_at_idx" ON "public"."comments"("repost_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "public"."likes" ADD CONSTRAINT "likes_repost_id_fkey" FOREIGN KEY ("repost_id") REFERENCES "public"."reposts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_repost_id_fkey" FOREIGN KEY ("repost_id") REFERENCES "public"."reposts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
