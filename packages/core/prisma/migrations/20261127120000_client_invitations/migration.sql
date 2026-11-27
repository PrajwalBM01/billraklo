ALTER TABLE "Client"
  ADD COLUMN "connectedAt" TIMESTAMP(3),
  ADD COLUMN "lastInboundAt" TIMESTAMP(3),
  ADD COLUMN "welcomeAttemptAt" TIMESTAMP(3);

-- Existing deduplication records must remain processed after the upgrade.
ALTER TABLE "WaMessage"
  ADD COLUMN "processingStartedAt" TIMESTAMP(3),
  ADD COLUMN "processedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "WaMessage" ALTER COLUMN "processedAt" DROP DEFAULT;
