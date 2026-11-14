import { Queue } from "bullmq";
import IORedis from "ioredis";
import { env } from "./env";

export const BILLS_QUEUE = "bills";
export const MAINTENANCE_QUEUE = "maintenance";
export type BillJob = { billId: string };

let connection: IORedis | undefined;
export function redis() {
  connection ??= new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  return connection;
}

let billQueue: Queue<BillJob> | undefined;
export function getBillQueue() {
  billQueue ??= new Queue<BillJob>(BILLS_QUEUE, {
    connection: redis(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: { age: 24 * 3600 },
      removeOnFail: { age: 7 * 24 * 3600 },
    },
  });
  return billQueue;
}

let maintenanceQueue: Queue | undefined;
export function getMaintenanceQueue() {
  return (maintenanceQueue ??= new Queue(MAINTENANCE_QUEUE, {
    connection: redis(),
  }));
}
