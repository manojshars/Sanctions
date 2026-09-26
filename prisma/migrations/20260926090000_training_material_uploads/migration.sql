-- AlterTable
ALTER TABLE "CourseResource" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pageCount" INTEGER,
ADD COLUMN     "sizeBytes" INTEGER,
ADD COLUMN     "storageKey" TEXT,
ADD COLUMN     "topicId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "uploadedById" TEXT,
ALTER COLUMN "courseId" DROP NOT NULL,
ALTER COLUMN "content" SET DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "CourseResource_storageKey_key" ON "CourseResource"("storageKey");

-- CreateIndex
CREATE INDEX "CourseResource_topicId_idx" ON "CourseResource"("topicId");

-- AddForeignKey
ALTER TABLE "CourseResource" ADD CONSTRAINT "CourseResource_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

