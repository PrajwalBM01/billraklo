/*
  Warnings:

  - Added the required column `waMediaId` to the `Bill` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "error" TEXT,
ADD COLUMN     "waMediaId" TEXT NOT NULL,
ALTER COLUMN "fileKey" DROP NOT NULL,
ALTER COLUMN "fileHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "WaMessage" (
    "id" TEXT NOT NULL,
    "receviedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Bill_status_receivedAt_idx" ON "Bill"("status", "receivedAt");
