import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { FileTextIcon, Plus, UsersIcon } from "lucide-react";
import { canReviewBill, listBills, listClients, parseStoredInvoices } from "@billraklo/core";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency, formatDate } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { BillsClientFilter } from "./bills-client-filter";
import { BillsTable, type BillRow } from "./bills-table";

export const metadata: Metadata = { title: "Bills · Billraklo" };

type BillsPageProps = {
  searchParams: Promise<{ client?: string | string[]; view?: string | string[] }>;
};

export default function BillsPage({ searchParams }: BillsPageProps) {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Bills</h1>
        <p className="text-sm text-muted-foreground">
          Review bills received on WhatsApp or added manually.
        </p>
      </div>
      <Suspense
        fallback={
          <Card>
            <CardContent className="flex h-40 items-center justify-center">
              <Spinner className="size-5 text-muted-foreground" />
            </CardContent>
          </Card>
        }
      >
        <BillsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function BillsContent({ searchParams }: BillsPageProps) {
  const [{ user }, params] = await Promise.all([requireSession(), searchParams]);
  const clients = await listClients(user.id);

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <UsersIcon className="size-5" />
          </div>
          <p className="font-medium">No clients yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add a client first. Once they forward a bill on WhatsApp, it will show up here.
          </p>
          <Link href="/clients" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Go to clients
          </Link>
        </CardContent>
      </Card>
    );
  }

  const requestedId = typeof params.client === "string" ? params.client : undefined;
  const selectedClient = clients.find((client) => client.id === requestedId);
  const attentionOnly = params.view === "attention";
  const bills = await listBills(user.id, selectedClient?.id, attentionOnly);

  const rows: BillRow[] = bills.map((bill) => {
    const invoices = bill.billEntries.length || bill.status === "confirmed"
      ? bill.billEntries.map(({ totalPaise, ...entry }) => ({
        ...entry,
        grandTotal: totalPaise == null ? null : Number(totalPaise) / 100,
      }))
      : parseStoredInvoices(bill.rawExtraction);
    const invoice = invoices.length === 1 ? invoices[0] : null;
    const total = invoices.length > 0 && invoices.every((entry) => entry.grandTotal != null)
      ? invoices.reduce((sum, entry) => sum + (entry.grandTotal ?? 0), 0)
      : null;

    return {
      id: bill.id,
      clientName: bill.client.legalName,
      status: bill.status,
      canReview: canReviewBill(bill.status, bill.waMsgId),
      receivedOn: formatDate(bill.receivedAt),
      kind: bill.mimeType === "application/pdf" ? "PDF" : bill.mimeType ? "Image" : "Manual entry",
      supplierName: invoices.length > 1 ? `${invoices.length} invoices` : invoice?.supplierName ?? null,
      invoiceNo: invoice?.invoiceNo ?? null,
      invoiceDate: invoice?.invoiceDate ?? null,
      amount: total != null ? formatCurrency(total) : null,
      confidence: bill.status === "confirmed" ? null : bill.confidence,
    };
  });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <p className="font-medium">
            {attentionOnly ? "Bills needing attention" : selectedClient?.legalName ?? "All bills"}
          </p>
          <p className="text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? "bill" : "bills"}
            {selectedClient ? " received" : " from all clients"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={selectedClient ? `/bills/new?client=${encodeURIComponent(selectedClient.id)}` : "/bills/new"}
            className={buttonVariants({ size: "sm" })}
          >
            <Plus aria-hidden="true" /> Add bill
          </Link>
          {attentionOnly && (
            <Link
              href={selectedClient ? `/bills?client=${encodeURIComponent(selectedClient.id)}` : "/bills"}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Clear attention filter
            </Link>
          )}
          <BillsClientFilter
            clients={clients.map((client) => ({ id: client.id, legalName: client.legalName }))}
            value={selectedClient?.id ?? "all"}
            attentionOnly={attentionOnly}
          />
        </div>
      </div>

      {rows.length > 0 ? (
        <BillsTable bills={rows} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <FileTextIcon className="size-5" />
            </div>
            <p className="font-medium">{attentionOnly ? "No bills need attention" : "No bills yet"}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {attentionOnly
                ? "Bills with missing details or extraction issues appear here."
                : selectedClient
                ? `${selectedClient.legalName} hasn't sent any bills yet.`
                : "Bills your clients send on WhatsApp will appear here."}
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
