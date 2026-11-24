BEGIN;

ALTER TABLE "Bill"
    ALTER COLUMN "waMsgId" DROP NOT NULL,
    ALTER COLUMN "waMediaId" DROP NOT NULL,
    ALTER COLUMN "mimeType" DROP NOT NULL,
    ADD COLUMN "reviewedAt" TIMESTAMP(3);

-- The extraction worker previously wrote whole rupees into these columns.
ALTER TABLE "BillEntry"
    ALTER COLUMN "taxablePaise" TYPE BIGINT USING ("taxablePaise"::BIGINT * 100),
    ALTER COLUMN "cgstPaise" TYPE BIGINT USING ("cgstPaise"::BIGINT * 100),
    ALTER COLUMN "sgstPaise" TYPE BIGINT USING ("sgstPaise"::BIGINT * 100),
    ALTER COLUMN "igstPaise" TYPE BIGINT USING ("igstPaise"::BIGINT * 100),
    ALTER COLUMN "totalPaise" TYPE BIGINT USING ("totalPaise"::BIGINT * 100);

COMMIT;
