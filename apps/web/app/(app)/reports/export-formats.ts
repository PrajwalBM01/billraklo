import { z } from "zod";
import type { PurchaseRow } from "./report-data";

export function decimalAmount(paise: bigint | null) {
  if (paise === null) return "";
  const digits = (paise < 0 ? -paise : paise).toString().padStart(3, "0");
  return `${paise < 0 ? "-" : ""}${digits.slice(0, -2)}.${digits.slice(-2)}`;
}

function csvText(value: string | null) {
  const raw = value ?? "";
  const safe = /^[\s\uFEFF]*[=+@-]|^[\t\r\n]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function purchaseCsv(rows: PurchaseRow[]) {
  return "\uFEFF" + [
    "Client,Supplier,Supplier GSTIN,Buyer GSTIN,Invoice number,Invoice date,Taxable INR,CGST INR,SGST INR,IGST INR,Total INR,Bill ID",
    ...rows.map((row) => [
      row.bill.client.legalName, row.supplierName, row.supplierGstin, row.buyerGstin, row.invoiceNo, row.invoiceDate,
    ].map(csvText).concat(
      [row.taxablePaise, row.cgstPaise, row.sgstPaise, row.igstPaise, row.totalPaise].map(decimalAmount),
      csvText(row.bill.id),
    ).join(",")),
  ].join("\r\n");
}

const ledger = z.string().trim().max(200);
export const tallyLedgers = z.object({
  purchase: ledger.min(1), cgst: ledger, sgst: ledger, igst: ledger, adjustment: ledger,
});

function xml(value: string) {
  return Array.from(value).filter((character) => {
    const point = character.codePointAt(0)!;
    return point === 9 || point === 10 || point === 13 ||
      (point >= 32 && point <= 0xd7ff) || (point >= 0xe000 && point <= 0xfffd) || point >= 0x10000;
  }).join("").replace(/[&<>"']/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]!);
}

export function tallyXml(rows: PurchaseRow[], ledgers: z.infer<typeof tallyLedgers>) {
  const zero = BigInt(0);
  const vouchers: string[] = [];
  for (const row of [...rows].reverse()) {
    const reference = row.invoiceNo || row.id;
    const supplier = row.supplierName?.trim();
    const date = row.invoiceDate;
    const total = row.totalPaise;
    const taxes = [
      { name: ledgers.cgst, amount: row.cgstPaise ?? zero },
      { name: ledgers.sgst, amount: row.sgstPaise ?? zero },
      { name: ledgers.igst, amount: row.igstPaise ?? zero },
    ];
    if (!supplier || !date || !z.iso.date().safeParse(date).success || total === null || total <= zero ||
      taxes.some(({ amount }) => amount < zero)) {
      return { error: `Invoice ${reference} needs a supplier, valid date and positive purchase total. Credit notes must be entered separately.` };
    }
    const tax = taxes.reduce((sum, { amount }) => sum + amount, zero);
    if ((row.taxablePaise === null && tax !== zero) || (row.taxablePaise !== null && row.taxablePaise < zero)) {
      return { error: `Invoice ${reference} needs a valid taxable amount for TallyPrime.` };
    }
    const base = row.taxablePaise ?? total;
    const postings = [{ name: ledgers.purchase, amount: base }, ...taxes,
      { name: ledgers.adjustment, amount: total - base - tax }].filter(({ amount }) => amount !== zero);
    const names = [supplier, ...postings.map(({ name }) => name)].map((name) => name.toLowerCase());
    if (names.includes("") || new Set(names).size !== names.length) {
      return { error: `Check the ledger names for invoice ${reference}. Enter a separate ledger for each tax or adjustment used.` };
    }
    vouchers.push(`<TALLYMESSAGE><VOUCHER REMOTEID="billraklo-${xml(row.id)}" VCHTYPE="Purchase" ACTION="Create">
<DATE>${date.replaceAll("-", "")}</DATE><VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
<PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW><ISINVOICE>No</ISINVOICE>
<REFERENCE>${xml(reference)}</REFERENCE><PARTYLEDGERNAME>${xml(supplier)}</PARTYLEDGERNAME>
<LEDGERENTRIES.LIST><LEDGERNAME>${xml(supplier)}</LEDGERNAME><ISPARTYLEDGER>Yes</ISPARTYLEDGER>
<ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${decimalAmount(total)}</AMOUNT>
<BILLALLOCATIONS.LIST><NAME>${xml(reference)}</NAME><BILLTYPE>New Ref</BILLTYPE><AMOUNT>${decimalAmount(total)}</AMOUNT></BILLALLOCATIONS.LIST>
</LEDGERENTRIES.LIST>
${postings.map(({ name, amount }) => `<LEDGERENTRIES.LIST><LEDGERNAME>${xml(name)}</LEDGERNAME>
<ISDEEMEDPOSITIVE>${amount > zero ? "Yes" : "No"}</ISDEEMEDPOSITIVE><AMOUNT>${decimalAmount(-amount)}</AMOUNT></LEDGERENTRIES.LIST>`).join("\n")}
</VOUCHER></TALLYMESSAGE>`);
  }
  return { content: `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE><HEADER><VERSION>1</VERSION><TALLYREQUEST>Import</TALLYREQUEST><TYPE>Data</TYPE><ID>Vouchers</ID></HEADER>
<BODY><DESC/><DATA>${vouchers.join("\n")}</DATA></BODY></ENVELOPE>` };
}
