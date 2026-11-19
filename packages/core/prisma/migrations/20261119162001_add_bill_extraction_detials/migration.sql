-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "confidence" TEXT,
ADD COLUMN     "extractModel" TEXT,
ADD COLUMN     "extractedAt" TIMESTAMP(3),
ADD COLUMN     "rawExtraction" JSONB;
