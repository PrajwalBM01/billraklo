import { prisma } from "./db";

/**
 * Lists bills for the signed-in user, newest first. Pass `clientId` to narrow
 * the list to one client; the user filter still applies either way.
 */
export function listBills(userId: string, clientId?: string) {
  return prisma.bill.findMany({
    where: {
      client: { userId },
      ...(clientId ? { clientId } : {}),
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
