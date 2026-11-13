import {
  redis,
  type BillJob,
  BILLS_QUEUE,
  prisma,
  sendText,
} from "@billraklo/core";
import { Worker } from "bullmq";
import { processBill } from "./jobs/process-bill";

const bills = new Worker<BillJob>(
  BILLS_QUEUE,
  (job) => processBill(job.data.billId),
  {
    connection: redis(),
    concurrency: 5,
  },
);

bills.on("completed", (job, result) =>
  console.log(`[bills] ${job.id} done`, result),
);

bills.on("failed", async (job, err) => {
  console.error(
    `[bills] ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`,
  );
  // Only act when there are no retries left
  if (!job || job.attemptsMade < (job.opts.attempts ?? 1)) return;
  try {
    const bill = await prisma.bill.update({
      where: { id: job.data.billId },
      data: { status: "failed", error: err.message },
      include: { client: true },
    });
    await sendText(
      bill.client.whatsappPhone,
      "Sorry, I couldn't open that file. Please send the bill again.",
    );
  } catch (e) {
    console.error("[bills] could not record failure", e);
  }
});

console.log("Worker started, waiting for jobs…");

async function shutdown() {
  await Promise.all([bills.close()]); // finish running jobs first
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
