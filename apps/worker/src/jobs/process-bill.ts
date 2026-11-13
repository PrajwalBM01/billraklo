import { prisma } from "@billraklo/core";

export async function processBill(billId: string) {
  const bill = await prisma.bill.findUnique({
    where: {
      id: billId,
    },
    include: {
      client: true,
    },
  });

  if (!bill || bill.status !== "received") return { skipped: true };

  
}
