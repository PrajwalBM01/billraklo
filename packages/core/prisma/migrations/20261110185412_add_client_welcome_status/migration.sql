/*
  Warnings:

  - A unique constraint covering the columns `[welcomeMessageId]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "welcomeError" TEXT,
ADD COLUMN     "welcomeMessageId" TEXT,
ADD COLUMN     "welcomeSentAt" TIMESTAMP(3),
ADD COLUMN     "welcomeStatus" TEXT NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE UNIQUE INDEX "Client_welcomeMessageId_key" ON "Client"("welcomeMessageId");
