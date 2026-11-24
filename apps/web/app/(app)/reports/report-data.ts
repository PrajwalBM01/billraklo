import { prisma } from "@billraklo/core";
import { z } from "zod";

export const reportFilters = z.object({
  client: z.string().max(100).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
}).refine(({ from, to }) => !from || !to || from <= to, "Start date must be on or before end date.");

export type ReportFilters = z.infer<typeof reportFilters>;

export function getPurchaseRegister(userId: string, { client, from, to }: ReportFilters) {
  return prisma.billEntry.findMany({
    where: {
      bill: { status: "confirmed", client: { userId }, ...(client ? { clientId: client } : {}) },
      ...(from || to ? { invoiceDate: { gte: from, lte: to } } : {}),
    },
    orderBy: [{ invoiceDate: "desc" }, { id: "asc" }],
    select: {
      id: true, supplierName: true, supplierGstin: true, buyerGstin: true, invoiceNo: true, invoiceDate: true,
      taxablePaise: true, cgstPaise: true, sgstPaise: true, igstPaise: true, totalPaise: true,
      bill: { select: { id: true, client: { select: { legalName: true } } } },
    },
  });
}

export type PurchaseRow = Awaited<ReturnType<typeof getPurchaseRegister>>[number];
