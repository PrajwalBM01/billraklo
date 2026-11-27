import { isUniqueViolation, normalizeIndianMobile, prisma, sendClientWelcome, sendText } from "@billraklo/core";
import crypto from "node:crypto";
import type { WhatsAppIncomingMessage } from "./webhook-types";

export async function verfiyMetaSignature(rawBody: Buffer, header: string, secret: string) {
  if (!header?.startsWith("sha256=")) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Claim each message separately; retries must not skip the rest of a batch. */
async function claimMessage(id: string) {
  const now = new Date();
  try {
    await prisma.waMessage.create({ data: { id, processingStartedAt: now } });
    return true;
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
  }
  const message = await prisma.waMessage.findUnique({ where: { id } });
  if (message?.processedAt) return false;
  const claimed = await prisma.waMessage.updateMany({
    where: {
      id,
      processedAt: null,
      OR: [
        { processingStartedAt: null },
        { processingStartedAt: { lt: new Date(now.getTime() - 120_000) } },
      ],
    },
    data: { processingStartedAt: now },
  });
  // Ask Meta to retry instead of acknowledging a message still being handled.
  if (!claimed.count) throw new Error("WhatsApp message is still being processed");
  return true;
}

async function handleMessage(message: WhatsAppIncomingMessage) {
  const phone = normalizeIndianMobile(message.from);
  if (!phone) return;
  const client = await prisma.client.findUnique({
    where: { whatsappPhone: phone },
    include: { user: { select: { name: true } } },
  });
  // The actual sender must be registered. An invitation link grants no access.
  if (!client) return;

  const timestamp = Number(message.timestamp) * 1000;
  if (!Number.isFinite(timestamp) || timestamp <= 0 || timestamp > Date.now() + 60_000) return;
  const incomingAt = new Date(Math.min(timestamp, Date.now()));
  // Use Meta's timestamp, not delivery time; delayed/reordered webhooks must not
  // reopen or shorten the customer-service window.
  await prisma.client.updateMany({
    where: { id: client.id, OR: [{ lastInboundAt: null }, { lastInboundAt: { lt: incomingAt } }] },
    data: { lastInboundAt: incomingAt },
  });
  await prisma.client.updateMany({
    where: { id: client.id, connectedAt: null },
    data: { connectedAt: incomingAt },
  });

  const welcome = await sendClientWelcome(client, client.user.name);
  const mediaInfo = "image" in message
    ? message.image
    : "document" in message && message.document.mime_type === "application/pdf"
      ? message.document
      : undefined;

  if (!mediaInfo) {
    // The welcome already explains uploads. Don't answer the first Hi twice.
    if (welcome.ok && "skipped" in welcome && client.connectedAt) {
      await sendText(phone, "Please send an image or PDF invoice to process your bills.");
    }
    return;
  }

  // A first invoice also connects the client and is processed immediately.
  // Reuse the bill after a queue failure; the message claim serializes retries.
  const existing = await prisma.bill.findFirst({ where: { waMsgId: message.id, clientId: client.id } });
  const bill = existing ?? await prisma.bill.create({
    data: { waMsgId: message.id, clientId: client.id, mimeType: mediaInfo.mime_type, waMediaId: mediaInfo.id },
  });
  if (bill.status === "received") {
    const response = await fetch(`${process.env.WORKER_API_URL}/api/internal/queue/bills`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.WORKER_API_SECRET! },
      body: JSON.stringify({ billId: bill.id, action: "process" }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Couldn't queue WhatsApp bill (HTTP ${response.status})`);
  }
  await sendText(phone, "Received ✅ Reading your bill…");
}

export async function handleMessages(messages: WhatsAppIncomingMessage[]) {
  for (const message of messages) {
    if (!(await claimMessage(message.id))) continue;
    try {
      await handleMessage(message);
      await prisma.waMessage.update({
        where: { id: message.id },
        data: { processedAt: new Date(), processingStartedAt: null },
      });
    } catch (error) {
      await prisma.waMessage.update({ where: { id: message.id }, data: { processingStartedAt: null } });
      throw error;
    }
  }
}
