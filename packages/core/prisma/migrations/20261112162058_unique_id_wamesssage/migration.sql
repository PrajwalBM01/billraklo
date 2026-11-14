/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `WaMessage` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "WaMessage_id_key" ON "WaMessage"("id");
