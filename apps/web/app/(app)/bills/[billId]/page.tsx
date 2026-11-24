import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import {
  billEntrySelect, billProcessingStatuses, canReviewBill, parseStoredInvoices, prisma,
} from "@billraklo/core";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { BillStatusBadge } from "../bills-table";
import type { InvoiceFields } from "../review-fields";
import { ReviewForm } from "./review-form";

export const metadata = { title: "Bill review | Billraklo" };

type Props = { params: Promise<{ billId: string }> };

export default function BillReviewPage({ params }: Props) {
  return (
    <div data-bill-workspace>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <BillReviewContent params={params} />
      </Suspense>
    </div>
  );
}

function rupees(paise: bigint | null) {
  if (paise == null) return "";
  const digits = (paise < 0 ? -paise : paise).toString().padStart(3, "0");
  return `${paise < 0 ? "-" : ""}${digits.slice(0, -2)}.${digits.slice(-2)}`;
}

async function BillReviewContent({ params }: Props) {
  const [{ user }, { billId }] = await Promise.all([requireSession(), params]);
  const bill = await prisma.bill.findFirst({
    where: { id: billId, client: { userId: user.id } },
    select: {
      id: true, status: true, confidence: true, receivedAt: true, reviewedAt: true,
      mimeType: true, fileKey: true, waMsgId: true, rawExtraction: true,
      client: { select: { id: true, legalName: true } },
      billEntries: { orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: billEntrySelect },
    },
  });
  if (!bill) notFound();

  const processing = billProcessingStatuses.includes(bill.status);
  const editable = canReviewBill(bill.status, bill.waMsgId);
  const rawInvoices = bill.billEntries.length ? [] : parseStoredInvoices(bill.rawExtraction);
  const entries: InvoiceFields[] = bill.billEntries.map((entry) => ({
    id: entry.id,
    supplierName: entry.supplierName ?? "",
    supplierGstin: entry.supplierGstin ?? "",
    buyerGstin: entry.buyerGstin ?? "",
    invoiceNo: entry.invoiceNo ?? "",
    invoiceDate: entry.invoiceDate ?? "",
    taxablePaise: rupees(entry.taxablePaise),
    cgstPaise: rupees(entry.cgstPaise),
    sgstPaise: rupees(entry.sgstPaise),
    igstPaise: rupees(entry.igstPaise),
    totalPaise: rupees(entry.totalPaise),
    lines: entry.lines.map((line) => ({
      description: line.description,
      hsn: line.hsn ?? "",
      taxable: String(line.taxable),
      ratePct: line.ratePct == null ? "" : String(line.ratePct),
    })),
  }));
  entries.push(...rawInvoices.map((entry) => ({
    supplierName: entry.supplierName ?? "",
    supplierGstin: entry.supplierGstin ?? "",
    buyerGstin: entry.buyerGstin ?? "",
    invoiceNo: entry.invoiceNo ?? "",
    invoiceDate: entry.invoiceDate ?? "",
    taxablePaise: entry.taxableTotal == null ? "" : String(entry.taxableTotal),
    cgstPaise: entry.cgst == null ? "" : String(entry.cgst),
    sgstPaise: entry.sgst == null ? "" : String(entry.sgst),
    igstPaise: entry.igst == null ? "" : String(entry.igst),
    totalPaise: entry.grandTotal == null ? "" : String(entry.grandTotal),
    lines: entry.lines.map((line) => ({
      description: line.description,
      hsn: line.hsn ?? "",
      taxable: String(line.taxable),
      ratePct: line.ratePct == null ? "" : String(line.ratePct),
    })),
  })));

  const original = bill.fileKey ? `/bills/${encodeURIComponent(bill.id)}/original` : null;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Link href={`/bills?client=${encodeURIComponent(bill.client.id)}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> Bills
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">{bill.client.legalName}</h1>
          <BillStatusBadge status={bill.status} confidence={bill.confidence} />
        </div>
        <p className="text-sm text-muted-foreground">
          {bill.waMsgId ? "Received on WhatsApp" : "Added manually"} on {formatDate(bill.receivedAt)}
          {bill.reviewedAt && ` · Reviewed ${formatDate(bill.reviewedAt)}`}
        </p>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="min-w-0 gap-4 lg:sticky lg:top-6">
          <CardHeader className="gap-x-2">
            <CardTitle><h2>Original document</h2></CardTitle>
            <CardDescription>{bill.mimeType === "application/pdf" ? "PDF" : bill.mimeType ? "Image" : "No attachment"}</CardDescription>
            {original && (
              <CardAction>
                <a href={original} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Open original <ExternalLink aria-hidden="true" />
                </a>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            {original ? (
              <div className="overflow-hidden rounded-lg border bg-muted/40">
                {bill.mimeType === "application/pdf" ? (
                  <iframe title="Original bill PDF" src={original} className="h-[55vh] min-h-64 w-full lg:h-[70vh]" />
                ) : (
                  // Private originals use a session-authenticated redirect to object storage.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={original} alt="Original bill" className="mx-auto max-h-[70vh] w-full object-contain" />
                )}
              </div>
            ) : (
              <div className="grid min-h-36 place-items-center rounded-lg border border-dashed p-4 text-center text-muted-foreground">
                <div className="space-y-2">
                  <FileText aria-hidden="true" className="mx-auto size-6" />
                  <p>{processing ? "The original will appear once it is stored." : "No original document is available for this bill."}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <ReviewForm key={bill.status} billId={bill.id} status={bill.status} entries={entries} editable={editable} processing={processing} />
      </div>
    </div>
  );
}
