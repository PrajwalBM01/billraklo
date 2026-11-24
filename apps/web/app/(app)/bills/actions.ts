"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import {
  billProcessingStatuses,
  billReviewStatuses,
  prisma,
  putObject,
} from "@billraklo/core";
import { requireSession } from "@/lib/session";
import { manualUploadMaxBytes } from "./review-fields";
import { reviewSchema } from "./review-validation";

export async function saveBillReview(billId: string, status: string, input: unknown) {
  const { user } = await requireSession();
  const parsed = reviewSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: "Check the highlighted fields before saving.",
      fields: Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join("."), issue.message])),
    };
  }

  const existingIds = parsed.data.flatMap((entry) => entry.id ? [entry.id] : []);
  if (new Set(existingIds).size !== existingIds.length) {
    return { error: "There are duplicate invoice entries. Reload the bill and try again." };
  }

  const ownedBill = { id: billId, client: { userId: user.id }, status };
  const where = billReviewStatuses.includes(status)
    ? ownedBill
    : { ...ownedBill, waMsgId: null };
  if (!billReviewStatuses.includes(status) && !billProcessingStatuses.includes(status)) {
    return { error: "This bill cannot be edited." };
  }

  try {
    const saved = await prisma.$transaction(async (transaction) => {
      const claimed = await transaction.bill.updateMany({
        where,
        data: { status: "confirmed", reviewedAt: new Date(), error: null },
      });
      if (!claimed.count) return false;

      const edits = parsed.data.flatMap(({ id, lines, ...details }) => id
        ? [{ where: { id }, data: { ...details, lines: { deleteMany: {}, create: lines } } }]
        : []);
      const additions = parsed.data.flatMap(({ id, lines, ...details }) => id
        ? []
        : [{ ...details, lines: { create: lines } }]);

      await transaction.bill.update({
        where: { id: billId },
        data: {
          billEntries: {
            deleteMany: { id: { notIn: existingIds } },
            update: edits,
            create: additions,
          },
        },
      });
      return true;
    });

    if (!saved) return { error: "This bill changed. Reload it to see the latest details before saving." };
  } catch (error) {
    console.error("Could not save bill review", error);
    return { error: "Could not save this bill. Try again." };
  }

  redirect(`/bills/${encodeURIComponent(billId)}`);
}

function fileType(bytes: Buffer) {
  if (bytes.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  return null;
}

export async function createManualBill(_: { error: string }, formData: FormData) {
  const { user } = await requireSession();
  const clientId = formData.get("client");
  const requestId = formData.get("requestId");
  const file = formData.get("file");
  const extract = formData.get("mode") === "upload";

  if (typeof clientId !== "string" || !clientId || clientId.length > 100) {
    return { error: "Choose a client for this bill." };
  }
  if (typeof requestId !== "string" || !/^[a-f0-9-]{36}$/.test(requestId)) {
    return { error: "Reload the form and try again." };
  }
  if (extract && (!(file instanceof File) || file.size === 0)) {
    return { error: "Select a PDF or image to upload." };
  }
  if (file instanceof File && file.size > manualUploadMaxBytes) {
    return { error: "Choose a file up to 10 MB." };
  }

  const client = await prisma.client.findFirst({ where: { id: clientId, userId: user.id }, select: { id: true } });
  if (!client) return { error: "Choose a client from your account." };

  const id = `manual-${requestId}`;
  const owned = { client: { userId: user.id } };
  let billId = id;
  let shouldExtract = false;
  let fileHash: string | undefined;

  try {
    const prior = await prisma.bill.findFirst({ where: { id, ...owned }, select: { id: true } });
    if (!prior) {
      const bytes = file instanceof File && file.size > 0 ? Buffer.from(await file.arrayBuffer()) : null;
      const mimeType = bytes ? fileType(bytes) : null;
      if (bytes && !mimeType) return { error: "Choose a valid PDF, JPEG, PNG, or WebP file." };
      if (bytes && mimeType) fileHash = createHash("sha256").update(bytes).digest("hex");

      const duplicate = fileHash
        ? await prisma.bill.findFirst({ where: { clientId, fileHash, ...owned }, select: { id: true } })
        : null;

      if (duplicate) {
        billId = duplicate.id;
      } else {
        const fileKey = fileHash && mimeType ? `clients/${clientId}/${fileHash}.${mimeType.split("/")[1]}` : null;
        if (bytes && fileKey && mimeType) await putObject(fileKey, bytes, mimeType);
        await prisma.bill.create({
          data: { id, clientId, mimeType, fileKey, fileHash, status: extract ? "stored" : "needs_review" },
        });
        shouldExtract = extract;
      }
    }
  } catch (error) {
    const existing = await prisma.bill.findFirst({
      where: { ...owned, OR: [{ id }, ...(fileHash ? [{ clientId, fileHash }] : [])] },
      select: { id: true },
    }).catch(() => null);
    if (!existing) {
      console.error("Could not create manual bill", error);
      return { error: "Could not add the bill. Try again." };
    }
    billId = existing.id;
  }

  if (shouldExtract) {
    try {
      const response = await fetch(`${process.env.WORKER_API_URL}/api/internal/queue/bills`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": process.env.WORKER_API_SECRET ?? "" },
        body: JSON.stringify({ billId, action: "extract" }),
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) throw new Error(`Queue returned ${response.status}`);
    } catch (error) {
      console.error("Could not enqueue manual bill", error);
      await prisma.bill.updateMany({
        where: { id: billId, status: "stored" },
        data: { status: "needs_review" },
      }).catch((updateError) => console.error("Could not record upload queue failure", updateError));
    }
  }

  redirect(`/bills/${encodeURIComponent(billId)}`);
}
