import { FilePart, generateText, Output } from "ai";
import sharp from "sharp";
import { createGoogle } from "@ai-sdk/google";
import { env } from "../env";
import {
  EXTRACT_PROMPT,
  extractedRupeesToPaise,
  getObject,
  InvoiceSchema,
  type Invoice,
  prisma,
  sendText,
} from "@billraklo/core";
import { UnrecoverableError } from "bullmq";

const google = createGoogle({
  apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// `Invoice` is z.infer<typeof InvoiceSchema> where the schema is an array,
// so one invoice is Invoice[number].
type InvoiceDoc = Invoice[number];
type Confidence = InvoiceDoc["confidence"];

const CONFIDENCE_RANK: Record<Confidence, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

/**
 * A bill can contain several invoices. Store the worst confidence of the batch:
 * a human has to review the bill as a whole, so one shaky invoice drags it down.
 * (Swap for an average/majority reducer if you'd rather soften that.)
 */
function consolidateConfidence(invoices: InvoiceDoc[]): Confidence {
  if (invoices.length === 0) return "low";
  return invoices.reduce<Confidence>(
    (worst, invoice) =>
      CONFIDENCE_RANK[invoice.confidence] < CONFIDENCE_RANK[worst]
        ? invoice.confidence
        : worst,
    "high",
  );
}

/**
 * Turn the invoice array into a jsonb-friendly object of objects, keyed by
 * invoice number (falling back to position, and de-duplicating collisions).
 */
function toRawExtraction(invoices: InvoiceDoc[]) {
  const seen = new Map<string, number>();
  const byInvoiceNo: Record<string, InvoiceDoc> = {};

  invoices.forEach((invoice, index) => {
    const base = invoice.invoiceNo?.trim() || `invoice_${index + 1}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    byInvoiceNo[count === 1 ? base : `${base}_duplicate_${count}`] = invoice;
  });

  return { invoiceCount: invoices.length, invoices: byInvoiceNo };
}

const WHATSAPP_TEXT_LIMIT = 4096;
const money = (value: number | null) =>
  value == null ? "Not available" : `₹${value.toFixed(2)}`;

function formatInvoice(invoice: InvoiceDoc) {
  const itemLines = invoice.lines.length
    ? invoice.lines
        .map(
          (line, index) => `${index + 1}. ${line.description}
   - HSN: ${line.hsn ?? "Not available"}
   - Taxable Amount: ${money(line.taxable)}
   - GST Rate: ${
     line.ratePct != null ? `${line.ratePct}%` : "Not available"
   }`,
        )
        .join("\n")
    : "No line items found.";

  return `Here are the details I found:

*Supplier Details:*
- Supplier Name: ${invoice.supplierName ?? "Not available"}
- Supplier GSTIN: ${invoice.supplierGstin ?? "Not available"}
- Buyer GSTIN: ${invoice.buyerGstin ?? "Not available"}

*Invoice Details:*
- Invoice Number: ${invoice.invoiceNo ?? "Not available"}
- Invoice Date: ${invoice.invoiceDate ?? "Not available"}

*Item Details:*
${itemLines}

*Tax Summary:*
- Taxable Total: ${money(invoice.taxableTotal)}
- CGST: ${money(invoice.cgst)}
- SGST: ${money(invoice.sgst)}
- IGST: ${money(invoice.igst)}

*Grand Total:* ${money(invoice.grandTotal)}`;
}

/** One WhatsApp body for the whole bill; WhatsApp caps text at 4096 chars. */
function formatExtraction(invoices: InvoiceDoc[]) {
  const body = invoices.map(formatInvoice).join("\n\n---\n\n");
  return body.length > WHATSAPP_TEXT_LIMIT
    ? `${body.slice(0, WHATSAPP_TEXT_LIMIT - 16)}\n…(truncated)`
    : body;
}

async function notifyClient(
  whatsappPhone: string,
  waMsgId: string,
  invoices: InvoiceDoc[],
  confidence: Confidence,
) {
  if (invoices.length === 0) {
    await sendText(
      whatsappPhone,
      "Couldn't read this bill clearly. It's under review — we'll follow up.",
      waMsgId,
    );
    return;
  }

  if (confidence === "high") {
    await sendText(whatsappPhone, formatExtraction(invoices), waMsgId);
  } else if (confidence === "medium") {
    await sendText(
      whatsappPhone,
      "Extracted! Details are under review.",
      waMsgId,
    );
  } else {
    await sendText(
      whatsappPhone,
      "Extracted, but the data wasn't clear enough to trust. Under review.",
      waMsgId,
    );
  }
}

async function prepImage(original: Buffer) {
  return sharp(original)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside" })
    .jpeg({ quality: 85 })
    .toBuffer();
}

export async function extractInvoice(input: Buffer, mimeType: string) {
  const content: FilePart =
    mimeType === "application/pdf"
      ? { type: "file", data: input, mediaType: "application/pdf" }
      : { type: "file", mediaType: "image", data: input };

  const result = await generateText({
    model: google(env.EXTRACT_MODEL),
    output: Output.object({ schema: InvoiceSchema }),
    temperature: 0,
    instructions: EXTRACT_PROMPT.text,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract invoice detials from this media file",
          },
          content,
        ],
      },
    ],
  });

  return { result: result.output, usage: result.usage };
}

export async function extractBill(billId: string) {
  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    include: { client: true },
  });
  if (!bill) return { skipped: true };
  if (bill.status !== "stored" && bill.status !== "extracting")
    return { skipped: true };
  if (!bill.fileKey || !bill.mimeType) throw new UnrecoverableError("Bill has no stored file");

  const started = await prisma.bill.updateMany({
    where: { id: bill.id, status: { in: ["stored", "extracting"] } },
    data: { status: "extracting" },
  });
  if (!started.count) return { skipped: true };

  const original = await getObject(bill.fileKey);
  const input =
    bill.mimeType === "application/pdf" ? original : await prepImage(original);

  let extracted: Awaited<ReturnType<typeof extractInvoice>>;
  try {
    extracted = await extractInvoice(input, bill.mimeType);
  } catch (error) {
    console.error(`[extract] bill ${bill.id} — AI extraction failed`, error);
    //throw unretryable error for now, temp
    throw new UnrecoverableError("Ai extraction error");
  }

  const invoices = extracted.result;
  const confidence = consolidateConfidence(invoices);
  const rawExtraction = toRawExtraction(invoices);

  const saved = await prisma.$transaction(async (transaction) => {
    const claimed = await transaction.bill.updateMany({
      where: { id: bill.id, status: "extracting" },
      data: {
        status: "extracted",
        confidence,
        extractedAt: new Date(),
        extractModel: env.EXTRACT_MODEL,
        rawExtraction,
        inputTokens: extracted.usage.inputTokens,
        outputToken: extracted.usage.outputTokens,
      },
    });
    if (!claimed.count) return false;

    await transaction.bill.update({
      where: { id: bill.id },
      data: {
        billEntries: {
          create: invoices.map((invoice) => ({
            supplierGstin: invoice.supplierGstin,
            supplierName: invoice.supplierName,
            buyerGstin: invoice.buyerGstin,
            invoiceNo: invoice.invoiceNo,
            invoiceDate: invoice.invoiceDate,
            cgstPaise: extractedRupeesToPaise(invoice.cgst),
            igstPaise: extractedRupeesToPaise(invoice.igst),
            sgstPaise: extractedRupeesToPaise(invoice.sgst),
            totalPaise: extractedRupeesToPaise(invoice.grandTotal),
            taxablePaise: extractedRupeesToPaise(invoice.taxableTotal),
            lines: {
              create: invoice.lines.map((line) => ({
                description: line.description,
                hsn: line.hsn,
                taxable: line.taxable,
                ratePct: line.ratePct,
              })),
            },
          })),
        },
      },
    });
    return true;
  });
  if (!saved) return { skipped: true };

  // The extraction is committed. Deliver WhatsApp confirmation separately.
  if (!bill.waMsgId) return { extracted: true };
  try {
    await notifyClient(
      bill.client.whatsappPhone,
      bill.waMsgId,
      invoices,
      confidence,
    );
  } catch (error) {
    console.error(`[extract] bill ${bill.id} — WhatsApp notify failed`, error);
  }

  return { extracted: true };
}
