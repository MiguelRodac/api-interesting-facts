-- CreateTable
CREATE TABLE "public"."reposts" (
    "id" TEXT NOT NULL,
    "original_fact_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reposts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reposts_author_id_original_fact_id_key" ON "public"."reposts"("author_id", "original_fact_id");

-- CreateIndex
CREATE INDEX "reposts_original_fact_id_created_at_idx" ON "public"."reposts"("original_fact_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "reposts_author_id_created_at_idx" ON "public"."reposts"("author_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "public"."reposts" ADD CONSTRAINT "reposts_original_fact_id_fkey" FOREIGN KEY ("original_fact_id") REFERENCES "public"."facts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reposts" ADD CONSTRAINT "reposts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("firebase_uid") ON DELETE CASCADE ON UPDATE CASCADE;
