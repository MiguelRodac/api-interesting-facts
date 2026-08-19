-- DropForeignKey
ALTER TABLE "public"."likes" DROP CONSTRAINT "likes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."likes" DROP CONSTRAINT "likes_fact_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."likes" ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("firebase_uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."likes" ADD CONSTRAINT "likes_fact_id_fkey" FOREIGN KEY ("fact_id") REFERENCES "public"."facts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
