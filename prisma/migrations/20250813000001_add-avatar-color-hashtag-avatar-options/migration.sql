-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_color" TEXT;

-- CreateTable
CREATE TABLE "avatar_options" (
    "id" TEXT NOT NULL,
    "url" TEXT,
    "color" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avatar_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hashtags" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hashtags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_hashtags" (
    "fact_id" TEXT NOT NULL,
    "hashtag_id" TEXT NOT NULL,

    CONSTRAINT "fact_hashtags_pkey" PRIMARY KEY ("fact_id","hashtag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "avatar_options_url_key" ON "avatar_options"("url");

-- CreateIndex
CREATE UNIQUE INDEX "hashtags_tag_key" ON "hashtags"("tag");

-- AddForeignKey
ALTER TABLE "fact_hashtags" ADD CONSTRAINT "fact_hashtags_fact_id_fkey" FOREIGN KEY ("fact_id") REFERENCES "facts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fact_hashtags" ADD CONSTRAINT "fact_hashtags_hashtag_id_fkey" FOREIGN KEY ("hashtag_id") REFERENCES "hashtags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
