import { z } from "zod";

export const InvoiceSchema = z.object({
  isTaxInvoice: z.boolean(),            // false for quotations, challans, chat screenshots
  supplierName: z.string().nullable(),
  supplierGstin: z.string().nullable(),
  buyerGstin: z.string().nullable(),
  invoiceNo: z.string().nullable(),
  invoiceDate: z.string().nullable(),   // YYYY-MM-DD
  lines: z.array(z.object({
    description: z.string(),
    hsn: z.string().nullable(),
    taxable: z.number(),
    ratePct: z.number().nullable(),
  })),
  taxableTotal: z.number().nullable(),
  cgst: z.number().nullable(),
  sgst: z.number().nullable(),
  igst: z.number().nullable(),
  grandTotal: z.number().nullable(),
  confidence: z.enum(["high", "medium", "low"]),
});

export type Invoice = z.infer<typeof InvoiceSchema>;