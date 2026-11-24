import { prisma } from "./db";
import type { Prisma } from "../generated/prisma/client";

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
      receivedAt: true,
      confidence: true,
      rawExtraction: true,
      client: {
        select: {
          id: true,
          legalName: true,
        },
      },
    },
  });
}
