-- CreateTable
CREATE TABLE "BillEntry" (
    "id" TEXT NOT NULL,
    "billId" TEXT NOT NULL,
    "supplierName" TEXT,
    "supplierGstin" TEXT,
    "buyerGstin" TEXT,
    "invoiceNo" TEXT,
    "invoiceDate" TEXT,
    "taxablePaise" INTEGER,
    "cgstPaise" INTEGER,
    "sgstPaise" INTEGER,
    "igstPaise" INTEGER,
    "totalPaise" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hsn" TEXT,
    "taxable" DOUBLE PRECISION NOT NULL,
    "ratePct" DOUBLE PRECISION,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BillEntry_billId_idx" ON "BillEntry"("billId");

-- AddForeignKey
ALTER TABLE "BillEntry" ADD CONSTRAINT "BillEntry_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "BillEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
