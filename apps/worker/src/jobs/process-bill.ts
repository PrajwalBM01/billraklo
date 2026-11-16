import {
  MAX_MEDIA_BYTES,
  downloadMedia,
  prisma,
  sendText,
  putObject,
  WhatsAppMediaError,
  getBillQueue,
} from "@billraklo/core";
import crypto from "crypto";

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

  if (!bill || bill.status !== "received") return { skipped: true };

  // Defence in depth: the webhook filters types too, but never download a file
  // type we can't process.
  if (!ALLOWED_MIME.has(bill.mimeType)) {
    throw new Error(`Unsupported file type: ${bill.mimeType}`);
  }

  // Translate "retrying won't help" media failures into readable bill errors
  // instead of five minutes of pointless retries.
  let bytes: Buffer;
  try {
    ({ bytes } = await downloadMedia(bill.waMediaId));
  } catch (error) {
    if (error instanceof WhatsAppMediaError) {
      if (!error.retryable) {
        await prisma.bill.update({
          where: { id: bill.id },
          data: { status: "failed", error: error.message },
        });
        await sendText(
          bill.client.whatsappPhone,
          "Sorry, I couldn't open that file. Please send it again — a photo or a PDF works best.",
        );
      }
      throw error; // retryable ones still fail the job so BullMQ retries
    }
    throw error;
  }

  const hash = crypto.createHash("sha256").update(bytes).digest("hex");

  // Fast path: same content already stored for this client. (P1-4 makes the
  // claim atomic; until then this check is an optimisation only.)
  const earlier = await prisma.bill.findFirst({
    where: { clientId: bill.clientId, fileHash: hash, NOT: { id: bill.id } },
    select: { id: true },
  });
  if (earlier) {
    await prisma.bill.update({
      where: { id: bill.id },
      data: { status: "duplicate", error: null },
    });
    await sendText(
      bill.client.whatsappPhone,
      "You've already sent this bill, so no need to send it again 👍",
    );
    return { duplicate: true };
  }

  // Key shape stays as-is until P1-3 (`{period}/{hash}.{ext}`);
  // the bucket now comes from env inside putObject.
  const key = `clients/${bill.clientId}/${hash}.${bill.mimeType.split("/")[1] ?? "bin"}`;

  // No try/catch: if the upload fails, this job MUST fail so BullMQ retries
  // and the failed-handler marks the bill failed. That is the whole fix.
  await putObject(key, bytes, bill.mimeType);

  await prisma.bill.update({
    where: { id: bill.id },
    data: { fileKey: key, fileHash: hash, status: "stored" },
  });

  await getBillQueue().add(
    "extract",
    { billId: bill.id },
    { jobId: `extract-${bill.id}` },
  );

  return { stored: key };
}
