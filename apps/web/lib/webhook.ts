import {
  downloadMedia,
  getBillQueue,
  prisma,
  sendText,
  uploadToSupabase,
} from "@billraklo/core";
import crypto from "node:crypto";
import {
  WhatsAppIncomingMessage,
  WhatsAppWebhookPayload,
} from "./webhook-types";

export async function verfiyMetaSignature(
  rawBody: Buffer<ArrayBuffer>,
  header: string,
  secret: string,
) {
  //check header
  if (!header?.startsWith("sha256=")) return false;

  //recompute the signature
  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", secret)
      .update(rawBody || "")
      .digest("hex");

  //compare both the recived and genrated signature
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function isPhNoAllowed(number: string) {
  if (!number) return false;

  const existing = await prisma.client.findUnique({
    where: { whatsappPhone: number },
  });

  if (existing) {
    return existing;
  } else {
    return false;
  }
}

export async function isMessageProcessed(body: WhatsAppWebhookPayload) {
  let processed = false;
  for (const change of body.entry[0].changes ?? []) {
    if (change.field == "messages") {
      let id: string | undefined;
      if (change.value.messages) {
        id = change.value.messages[0]?.id;
      }

      if (change.value.statuses) {
        const status = change.value.statuses[0];
        id = `${status.id}_${status.status}_${status.timestamp}`;
      }

      if (!id) {
        continue;
      }

      try {
        await prisma.waMessage.create({
          data: {
            id: id,
          },
        });
      } catch (error: any) {
        if ((error.code = "P2002")) {
          console.log("duplicate webhook");
          processed = true;
        }
      }
    }
  }
  return processed;
}

export async function handleMessages(messages: WhatsAppIncomingMessage[]) {
  for (const message of messages) {
    //check phone number is registred as client and is allowed
    const client = await isPhNoAllowed(message.from);
    if (!client) {
      console.error("Phone number is not allowed", message.from);
      continue;
    }

    //message is not image or doc, send not allowed
    const mediaInfo =
      "image" in message
        ? message.image
        : "document" in message &&
            message.document.mime_type === "application/pdf"
          ? message.document
          : undefined;

    if (!mediaInfo) {
      // text, sticker, audio, non-PDF document, anything else →
      await sendText(message.from, "Please send only Image or PDF invoices.");
      continue;
    }

    //store half bill in bill table and add to queue
    try {
      const bill = await prisma.bill.create({
        data: {
          clientId: client.id,
          mimeType: mediaInfo.mime_type,
          waMediaId: mediaInfo.id,
        },
      });

      await getBillQueue().add(
        "process",
        { billId: bill.id },
        { jobId: bill.id },
      );

      await sendText(message.from, "Received ✅ Reading your bill…");
    } catch (error) {
      console.error("Couldn't process message:", error);
    }
  }
}
