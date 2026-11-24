import {
  redis,
  type BillJob,
  BILLS_QUEUE,
  prisma,
  isPrismaError,
  sendText,
  getMaintenanceQueue,
  MAINTENANCE_QUEUE,
} from "@billraklo/core";
import { Worker } from "bullmq";
import { processBill } from "./jobs/process-bill";
import { sweepStuckBills } from "./jobs/sweep";
import { extractBill } from "./jobs/extract";
import { env } from "./env";
import { api } from "./api";
import { serve } from "@hono/node-server";

const bills = new Worker<BillJob>(
  BILLS_QUEUE,
  (job) =>
    job.name === "extract"
      ? extractBill(job.data.billId)
      : processBill(job.data.billId),
  {
    connection: redis(),
    concurrency: 5,
  },
);

bills.on("completed", (job, result) =>
  console.log(`[bills] ${job.id} done`, result),
);

bills.on("failed", async (job, err) => {
  console.log(err);
  console.error(
    `[bills] ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`,
  );
  // Only act when there are no retries left
  const unrecoverable = err.name === "UnrecoverableError";
  const exhausted = job && job.attemptsMade >= (job.opts.attempts ?? 1);
  if (!job || !(unrecoverable || exhausted)) return;
  try {
    const bill = await prisma.bill.update({
      where: {
        id: job.data.billId,
        status: { in: job.name === "extract" ? ["stored", "extracting"] : ["received", "stored"] },
      },
      data: { status: "failed", error: err.message },
      include: { client: true },
    });
    if (bill.waMsgId) await sendText(
      bill.client.whatsappPhone,
      "Sorry, I couldn't open that file. Please send the bill again.",
    );
  } catch (e) {
    if (!isPrismaError(e, "P2025")) console.error("[bills] could not record failure", e);
  }
});

// const maintenance = new Worker(MAINTENANCE_QUEUE, () => sweepStuckBills(), {
//   connection: redis(),
// });

// Run the sweep every 5 minutes. On restart this updates the schedule instead of duplicating it.
// await getMaintenanceQueue().upsertJobScheduler(
//   "sweep-stuck-bills",
//   { every: 5 * 60 * 1000 },
//   { name: "sweep" },
// );

const server = serve(
  { fetch: api.fetch, port: env.WORKER_API_PORT },
  (info) => {
    console.log(`Worker API listening on http://localhost:${info.port}`);
  },
);

console.log("Worker started, waiting for jobs…");

async function shutdown() {
  await Promise.all([
    bills.close(),
    // maintenance.close()
  ]); // finish running jobs first
  server.close();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
