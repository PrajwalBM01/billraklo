import {
  downloadMedia,
  prisma,
  sendText,
  uploadToSupabase,
} from "@billraklo/core";
import crypto from "crypto";

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

  const { bytes } = await downloadMedia(bill.waMediaId);
  const hash = crypto.createHash("sha256").update(bytes).digest("hex");

  //same file sent before as a different mesage
  const earlier = await prisma.bill.findFirst({
    where: { clientId: bill.clientId, fileHash: hash, NOT: { id: bill.id } },
  });
  if (earlier) return markDuplicate(bill.id, bill.client.whatsappPhone);

  const key = `clients/${bill.clientId}/${hash}.${bill.mimeType ?? "bin"}`;
  await uploadToSupabase("billraklo", key, bytes, bill.mimeType);

  try {
    await prisma.bill.update({
      where: {
        id: bill.id,
      },
      data: {
        fileKey: key,
        fileHash: hash,
        status: "stored",
      },
    });
  } catch (e) {
    console.error("somthing weent wrong while updating the file info");
  }
  return { stored: key };
}

async function markDuplicate(billId: string, phone: string) {
  await prisma.bill.update({
    where: { id: billId },
    data: { status: "duplicate" },
  });
  await sendText(
    phone,
    "You've already sent this bill, so no need to send it again 👍",
  );
  return { duplicate: true };
}
