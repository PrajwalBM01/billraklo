import { prisma } from "./db";
import type { Prisma } from "../generated/prisma/client";
import { InvoiceSchema } from "./ai/invoice-schema";

export const billReviewStatuses = ["extracted", "needs_review", "failed"];
export const billProcessingStatuses = ["received", "stored", "extracting"];

export function canReviewBill(status: string, waMsgId: string | null) {
  return billReviewStatuses.includes(status) || (waMsgId === null && billProcessingStatuses.includes(status));
}

export const billEntrySelect = {
  id: true,
  supplierName: true,
  supplierGstin: true,
  buyerGstin: true,
  invoiceNo: true,
  invoiceDate: true,
  taxablePaise: true,
  cgstPaise: true,
  sgstPaise: true,
  igstPaise: true,
  totalPaise: true,
  lines: {
    orderBy: { id: "asc" },
    select: { description: true, hsn: true, taxable: true, ratePct: true },
  },
} satisfies Prisma.BillEntrySelect;

export function parseStoredInvoices(raw: Prisma.JsonValue | null) {
  if (raw === null) return [];
  const stored = typeof raw === "object" && !Array.isArray(raw) ? raw.invoices : null;
  const invoices = stored && typeof stored === "object" && !Array.isArray(stored)
    ? Object.values(stored)
    : Array.isArray(raw) ? raw : [raw];
  const parsed = InvoiceSchema.safeParse(invoices);
  return parsed.success ? parsed.data : [];
}

export function extractedRupeesToPaise(amount: number | null) {
  if (amount === null) return null;
  const paise = Math.round(Math.abs(amount) * 100);
  return Number.isSafeInteger(paise) ? BigInt(Math.sign(amount) * paise) : null;
}

export const billAttentionFilter = {
  OR: [
    { status: { in: ["needs_review", "failed"] } },
    { status: "extracted", confidence: { in: ["medium", "low"] } },
  ],
} satisfies Prisma.BillWhereInput;

/**
 * Lists bills for the signed-in user, newest first. Pass `clientId` to narrow
 * the list to one client; the user filter still applies either way.
 */
export function listBills(userId: string, clientId?: string, attentionOnly = false) {
  return prisma.bill.findMany({
    where: {
      client: { userId },
      ...(clientId ? { clientId } : {}),
      ...(attentionOnly ? billAttentionFilter : {}),
    },
    orderBy: { receivedAt: "desc" },
    select: {
      id: true,
      status: true,
      mimeType: true,
      waMsgId: true,
      receivedAt: true,
      confidence: true,
      rawExtraction: true,
      billEntries: {
        select: { supplierName: true, invoiceNo: true, invoiceDate: true, totalPaise: true },
      },
      client: {
        select: {
          id: true,
          legalName: true,
        },
      },
    },
  });
}
