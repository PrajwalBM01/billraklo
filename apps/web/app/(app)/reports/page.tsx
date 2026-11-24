import { Suspense } from "react";
import Link from "next/link";
import { listClients } from "@billraklo/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireSession } from "@/lib/session";
import { decimalAmount } from "./export-formats";
import { ReportActions } from "./report-actions";
import { getPurchaseRegister, reportFilters } from "./report-data";

export const metadata = { title: "Reports | Billraklo" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const zero = BigInt(0);
const countFormatter = new Intl.NumberFormat("en-IN");

export default function ReportsPage({ searchParams }: Props) {
  return (
    <div data-purchase-report className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Purchase register</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review totals and export invoices marked as reviewed.</p>
      </header>
      <Suspense fallback={<Skeleton className="h-72" />}>
        <ReportContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ReportContent({ searchParams }: Props) {
  const [{ user }, params] = await Promise.all([requireSession(), searchParams]);
  const filters = reportFilters.safeParse(Object.fromEntries(Object.entries(params).filter(([, value]) => value !== "")));
  const [clients, rows] = await Promise.all([
    listClients(user.id),
    filters.success ? getPurchaseRegister(user.id, filters.data) : [],
  ]);
  const selected = clients.find(({ id }) => id === params.client);
  const period = [filters.data?.from ?? "Any start date", filters.data?.to ?? "Any end date"].join(" to ");
  const totals = rows.reduce(({ total, gst }, row) => ({
    total: total + (row.totalPaise ?? zero),
    gst: gst + (row.cgstPaise ?? zero) + (row.sgstPaise ?? zero) + (row.igstPaise ?? zero),
  }), { total: zero, gst: zero });
  const missingTotal = rows.some((row) => row.totalPaise === null);

  return (
    <>
      <form action="/reports" className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4 print:hidden">
        <div className="min-w-48 flex-1 space-y-1.5">
          <Label htmlFor="report-client">Client</Label>
          <select id="report-client" name="client" defaultValue={selected?.id ?? ""} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
            <option value="">All clients</option>
            {clients.map(({ id, legalName }) => <option key={id} value={id}>{legalName}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="report-from">Invoice date from</Label>
          <Input id="report-from" name="from" type="date" defaultValue={typeof params.from === "string" ? params.from : ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="report-to">Invoice date to</Label>
          <Input id="report-to" name="to" type="date" defaultValue={typeof params.to === "string" ? params.to : ""} />
        </div>
        <Button type="submit">Apply filters</Button>
      </form>
      {!filters.success ? (
        <p role="alert" className="text-sm text-destructive">Enter valid invoice dates with the start date on or before the end date.</p>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="space-y-2">
            <h2 className="font-medium">No reviewed invoices match these filters</h2>
            <p className="text-sm text-muted-foreground">Change the filters or <Link href="/bills" className="underline">review bills</Link> to include them here.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3 print:grid-cols-3">
            {[
              ["Reviewed invoices", countFormatter.format(rows.length)],
              [missingTotal ? "Known invoice totals (INR)" : "Invoice total (INR)", decimalAmount(totals.total)],
              ["Recorded GST (INR)", decimalAmount(totals.gst)],
            ].map(([label, value]) => (
              <Card key={label} size="sm" className="gap-1">
                <CardHeader><CardTitle>{label}</CardTitle></CardHeader>
                <CardContent className="text-xl font-semibold tabular-nums">{value}</CardContent>
              </Card>
            ))}
          </div>
          <ReportActions key={JSON.stringify(filters.data)} filters={filters.data} />
          <section aria-labelledby="register-heading" className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="register-heading" className="font-heading text-lg font-semibold">Reviewed invoices</h2>
              <p className="text-sm text-muted-foreground">{selected?.legalName ?? "All clients"} · {period}</p>
            </div>
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-3">Date</TableHead>
                    <TableHead>Client / Supplier</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead className="text-right">Taxable (INR)</TableHead>
                    <TableHead className="text-right">GST (INR)</TableHead>
                    <TableHead className="pr-3 text-right">Total (INR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const taxes = [row.cgstPaise, row.sgstPaise, row.igstPaise];
                    const gst = taxes.every((amount) => amount === null) ? null : taxes.reduce<bigint>((sum, amount) => sum + (amount ?? zero), zero);
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="pl-3">{row.invoiceDate ?? "—"}</TableCell>
                        <TableCell className="max-w-64 whitespace-normal">
                          <span className="block break-words font-medium">{row.supplierName ?? "Unknown supplier"}</span>
                          <span className="block break-words text-xs text-muted-foreground">{row.bill.client.legalName}</span>
                        </TableCell>
                        <TableCell className="max-w-32 whitespace-normal">
                          <Link href={`/bills/${encodeURIComponent(row.bill.id)}`} className="break-words underline underline-offset-2 print:no-underline">
                            {row.invoiceNo ?? "View bill"}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{decimalAmount(row.taxablePaise) || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{decimalAmount(gst) || "—"}</TableCell>
                        <TableCell className="pr-3 text-right tabular-nums">{decimalAmount(row.totalPaise) || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
