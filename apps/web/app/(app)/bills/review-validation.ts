import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).transform((value) => value || null);
const gstin = z.string().trim().toUpperCase()
  .refine((value) => !value || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[A-Z0-9]$/.test(value),
    "Enter a valid 15-character GSTIN.")
  .transform((value) => value || null);

const amountPattern = /^-?\d{1,12}(\.\d{1,2})?$/;
const amountError = "Enter an amount with up to two decimal places.";
const rupees = z.string().trim().regex(amountPattern, amountError);

function toPaise(value: string) {
  const [whole, fraction = ""] = value.replace(/^-/, "").split(".");
  const paise = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
  return value.startsWith("-") ? -paise : paise;
}

const optionalAmount = z.string().trim().refine((value) => !value || amountPattern.test(value), amountError)
  .transform((value) => value ? toPaise(value) : null);
const gstRate = z.string().trim()
  .refine((value) => !value || /^\d{1,3}(\.\d{1,2})?$/.test(value), "Enter a rate with up to two decimal places.")
  .refine((value) => Number(value) <= 100, "Enter a rate from 0 to 100.")
  .transform((value) => value === "" ? null : Number(value));

export const reviewSchema = z.array(z.object({
  id: z.string().max(100).optional(),
  supplierName: z.string().trim().min(1, "Enter the supplier name.").max(200),
  supplierGstin: gstin,
  buyerGstin: gstin,
  invoiceNo: optionalText(100),
  invoiceDate: z.iso.date({ error: "Enter a valid invoice date." }),
  taxablePaise: optionalAmount,
  cgstPaise: optionalAmount,
  sgstPaise: optionalAmount,
  igstPaise: optionalAmount,
  totalPaise: rupees.transform(toPaise),
  lines: z.array(z.object({
    description: z.string().trim().min(1, "Enter a description.").max(500),
    hsn: z.string().trim().regex(/^(?:\d{4,8})?$/, "Enter a 4 to 8 digit HSN or SAC code.")
      .transform((value) => value || null),
    taxable: rupees.transform(Number),
    ratePct: gstRate,
  })).max(500, "Each invoice can have up to 500 line items."),
})).min(1, "Add at least one invoice.").max(100, "A bill can have up to 100 invoices.");
