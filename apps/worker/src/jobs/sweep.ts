import { getBillQueue, prisma } from "@billraklo/core";

export async function sweepStuckBills() {
  const cutoff = new Date(Date.now() - 5 * 60 * 1000);
  const stuck = await prisma.bill.findMany({
    where: {
      status: "received",
      receivedAt: { lt: cutoff },
    },
    select: { id: true },
    take: 100,
  });

  const queue = getBillQueue();
  let requeued = 0;
  for (const { id } of stuck) {
    // A job that's waiting or running is fine; only re-add missing ones
    if (!(await queue.getJob(id))) {
      await queue.add("process", { billId: id }, { jobId: id });
      requeued++;
    }
  }
  return { requeued };
}
