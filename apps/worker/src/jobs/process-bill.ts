import {
  downloadMedia,
  prisma,
  sendText,
  putObject,
  WhatsAppMediaError,
  getBillQueue,
  isUniqueViolation,
} from "@billraklo/core";
import crypto from "crypto";
import { isValidBill } from "../helpers/ai";
import { UnrecoverableError } from "bullmq";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export async function processBill(billId: string) {
  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: { client: true },
  });

  if (bill?.status === "stored" && bill.waMsgId) {
    await enqueueExtraction(bill.id);
    return { stored: true };
  }
  if (!bill || bill.status !== "received") return { skipped: true };

  //unsupported files get failed
  if (!bill.mimeType || !bill.waMediaId || !bill.waMsgId || !ALLOWED_MIME.has(bill.mimeType)) {
    throw new UnrecoverableError(`Unsupported file type: ${bill.mimeType}`);
  }

  //download media, only retry when its a network issue else fail
  let bytes: Buffer;
  try {
    ({ bytes } = await downloadMedia(bill.waMediaId));
  } catch (error) {
    if (error instanceof WhatsAppMediaError && !error.retryable) {
      throw new UnrecoverableError(error.message);
    }
    throw error;
  }

  //after we get the downloaded content
  const hash = crypto.createHash("sha256").update(bytes).digest("hex");

  const findEarlierBill = () => prisma.bill.findFirst({
    where: { clientId: bill.clientId, fileHash: hash, NOT: { id: bill.id } },
    select: { fileKey: true, mimeType: true },
  });

  const markDuplicate = async (original: { fileKey: string | null; mimeType: string | null }) => {
    const changed = await prisma.bill.updateMany({
      where: { id: bill.id, status: "received" },
      data: { status: "duplicate", error: null, fileKey: original.fileKey, mimeType: original.mimeType },
    });
    if (!changed.count) return { skipped: true };
    await sendText(bill.client.whatsappPhone, "You've already sent this bill, so no need to send it again.", bill.waMsgId ?? undefined);
    return { duplicate: true };
  };

  const earlier = await findEarlierBill();
  if (earlier) return markDuplicate(earlier);

  const key = `clients/${bill.clientId}/${hash}.${bill.mimeType.split("/")[1]}`;
  await putObject(key, bytes, bill.mimeType);
  try {
    const claimed = await prisma.bill.updateMany({
      where: { id: bill.id, status: "received" },
      data: { fileKey: key, fileHash: hash },
    });
    if (!claimed.count) return { skipped: true };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const duplicate = await findEarlierBill();
    if (!duplicate) throw error;
    return markDuplicate(duplicate);
  }

  const validBill = await isValidBill(
    bill.mimeType === "application/pdf" ? "document" : "image",
    bytes,
    bill.mimeType,
  );
  if (!validBill) {
    const changed = await prisma.bill.updateMany({
      where: { id: bill.id, status: "received" },
      data: { status: "failed", error: "Unprocessable bill" },
    });
    if (!changed.count) return { skipped: true };
    await sendText(
      bill.client.whatsappPhone,
      "This doesn't seem to be a processable bill",
      bill.waMsgId,
    );
    return { skipped: true };
  }

  const changed = await prisma.bill.updateMany({
    where: { id: bill.id, status: "received" },
    data: { status: "stored" },
  });
  if (!changed.count) return { skipped: true };

  await enqueueExtraction(bill.id);
  return { stored: true };
}

function enqueueExtraction(billId: string) {
  return getBillQueue().add(
    "extract",
    { billId },
    { jobId: `extract-${billId}` },
  );
}
