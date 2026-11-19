import { FilePart, generateText, Output, zodSchema } from "ai";
import sharp from "sharp";
import { createGoogle } from "@ai-sdk/google";
import { env } from "../env";
import {
  EXTRACT_PROMPT,
  getObject,
  InvoiceSchema,
  prisma,
  sendText,
} from "@billraklo/core";
import { UnrecoverableError } from "bullmq";

const google = createGoogle({
  apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
});

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
  // Idempotent: never re-extract a bill a human has already touched.
  if (bill.status === "needs_review" || bill.status === "confirmed")
    return { skipped: true };
  if (!bill.fileKey) throw new UnrecoverableError("Bill has no stored file");

  await prisma.bill.update({
    where: { id: bill.id },
    data: { status: "extracting" },
  });

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

  const result = extracted.result;

  const content = `
Here are the details I found:

*Supplier Details:*
- Supplier Name: ${result.supplierName ?? "Not available"}
- Supplier GSTIN: ${result.supplierGstin ?? "Not available"}
- Buyer GSTIN: ${result.buyerGstin ?? "Not available"}

*Invoice Details:*
- Invoice Number: ${result.invoiceNo ?? "Not available"}
- Invoice Date: ${result.invoiceDate ?? "Not available"}

*Item Details:*
${
  result.lines?.length
    ? result.lines
        .map(
          (line, index) => `
${index + 1}. ${line.description}
   - HSN: ${line.hsn ?? "Not available"}
   - Taxable Amount: ₹${line.taxable.toFixed(2)}
   - GST Rate: ${line.ratePct != null ? `${line.ratePct}%` : "Not available"}
`,
        )
        .join("")
    : "No line items found."
}

*Tax Summary:*
- Taxable Total: ₹${result.taxableTotal?.toFixed(2) ?? "Not available"}
- CGST: ₹${result.cgst?.toFixed(2) ?? "Not available"}
- SGST: ₹${result.sgst?.toFixed(2) ?? "Not available"}
- IGST: ₹${result.igst?.toFixed(2) ?? "Not available"}

*Grand Total:* ₹${result.grandTotal?.toFixed(2) ?? "Not available"}
`;

  console.log(extracted.result, extracted.usage);
  await prisma.bill.update({
    where: { id: bill.id },
    data: {
      status: "extracted",
      confidence: result.confidence,
      extractedAt: new Date(),
      extractModel: env.EXTRACT_MODEL,
      rawExtraction: result,
      inputTokens: extracted.usage.inputTokens,
      outputToken: extracted.usage.outputTokens,
    },
  });

  if (result.confidence === "high") {
    await sendText(bill.client.whatsappPhone, content, bill.waMsgId);
  } else {
    await sendText(
      bill.client.whatsappPhone,
      "Extracted!, details under review",
      bill.waMsgId,
    );
  }
  return { extracted: true };
}
