import { redis, type BillJob, BILLS_QUEUE } from "@billraklo/core";
import { Worker } from "bullmq";


const bills = new Worker<BillJob>(
  BILLS_QUEUE,
  async (job) => console.log("jobsss", job.data),
  {
    connection: redis(),
    concurrency: 5,
  },
);
console.log("Worker started, waiting for jobs…");

async function shutdown() {
  await Promise.all([bills.close()]); // finish running jobs first
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log("working");
