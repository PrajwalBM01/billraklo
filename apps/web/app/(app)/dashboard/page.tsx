import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, CircleAlert, Clock3, ReceiptText, Users } from "lucide-react";
import { billAttentionFilter, prisma } from "@billraklo/core";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { BillStatusBadge } from "../bills/bills-table";
import { AddClientDialog } from "../clients/add-client-dialog";

export const metadata: Metadata = { title: "Dashboard | Billraklo" };

const monthFormatter = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});
const countFormatter = new Intl.NumberFormat("en-IN");

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-7">
      <header>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track bills collected on WhatsApp.</p>
      </header>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div role="status" className="grid gap-4 sm:grid-cols-3">
      <span className="sr-only">Loading dashboard</span>
      {[0, 1, 2].map((item) => <Skeleton key={item} className="h-29 rounded-xl" />)}
      <Skeleton className="h-56 rounded-xl sm:col-span-3" />
    </div>
  );
}

async function DashboardContent() {
  const { user } = await requireSession();
  const now = new Date();
  // Shift to Indian Standard Time before reading the calendar month.
  const inIndia = new Date(now.getTime() + 330 * 60_000);
  const monthStart = new Date(Date.UTC(inIndia.getUTCFullYear(), inIndia.getUTCMonth(), 1) - 330 * 60_000);
  const ownedBills = { client: { userId: user.id } };

  const [receivedCount, processingCount, clientCount, attentionCount, recentBills] = await Promise.all([
    prisma.bill.count({ where: { ...ownedBills, receivedAt: { gte: monthStart, lte: now } } }),
    prisma.bill.count({ where: { ...ownedBills, status: { in: ["received", "stored", "extracting"] } } }),
    prisma.client.count({ where: { userId: user.id } }),
    prisma.bill.count({ where: { ...ownedBills, ...billAttentionFilter } }),
    prisma.bill.findMany({
      where: ownedBills,
      orderBy: [{ receivedAt: "desc" }, { id: "desc" }],
      take: 5,
      select: {
        id: true,
        receivedAt: true,
        status: true,
        confidence: true,
        mimeType: true,
        client: { select: { id: true, legalName: true } },
      },
    }),
  ]);

  const metrics = [
    { label: "Bills received", detail: monthFormatter.format(now), value: receivedCount, icon: ReceiptText },
    { label: "In progress", detail: "Queued or extracting", value: processingCount, icon: Clock3 },
    { label: "Registered clients", detail: "In your account", value: clientCount, icon: Users },
  ];

  return (
    <>
      <section aria-label="Bill collection summary" className="grid gap-3 sm:grid-cols-3">
        {metrics.map(({ label, detail, value, icon: Icon }) => (
          <Card key={label} size="sm" className="gap-2">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>{label}</CardTitle>
              <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            </CardHeader>
            <CardContent className="gap-0.5">
              <p className="text-3xl font-semibold tracking-tight tabular-nums">{countFormatter.format(value)}</p>
              <p className="text-xs text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {attentionCount > 0 && (
        <Card size="sm" className="bg-amber-50 text-amber-950 ring-amber-200 dark:bg-amber-950/35 dark:text-amber-100 dark:ring-amber-900">
          <CardContent className="flex flex-row flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400" />
              <div>
                <h2 className="font-semibold">
                  {countFormatter.format(attentionCount)} {attentionCount === 1 ? "bill needs" : "bills need"} attention
                </h2>
                <p className="text-sm text-amber-900 dark:text-amber-200">Check bills with failed or uncertain extraction.</p>
              </div>
            </div>
            <Link href="/bills?view=attention" className={buttonVariants({ variant: "outline", size: "sm" })}>
              View flagged bills <ArrowRight aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
      )}

      <Card className="gap-4">
        <CardHeader className="gap-x-3">
          <CardTitle><h2 className="text-lg font-semibold">Recent bills</h2></CardTitle>
          <CardDescription>Latest WhatsApp submissions</CardDescription>
          {recentBills.length > 0 && (
            <CardAction>
              <Link href="/bills" className={buttonVariants({ variant: "outline", size: "sm" })}>
                All bills <ArrowRight aria-hidden="true" />
              </Link>
            </CardAction>
          )}
        </CardHeader>
        <CardContent>
          {recentBills.length ? (
            <ul className="divide-y border-y">
              {recentBills.map((bill) => (
                <li key={bill.id} className="flex items-center gap-3 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <ReceiptText aria-hidden="true" className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/bills?client=${encodeURIComponent(bill.client.id)}`} className="block truncate font-medium hover:underline">
                      {bill.client.legalName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {bill.mimeType === "application/pdf" ? "PDF" : "Image"} · <time dateTime={bill.receivedAt.toISOString()}>{formatDate(bill.receivedAt)}</time>
                    </p>
                  </div>
                  <BillStatusBadge status={bill.status} confidence={bill.confidence} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center">
              <ReceiptText aria-hidden="true" className="size-6 text-emerald-700 dark:text-emerald-400" />
              <h3 className="font-medium">No bills received yet</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                {clientCount === 0
                  ? "Add a client to invite them to send bills through WhatsApp."
                  : "Bills sent by your registered WhatsApp contacts will appear here."}
              </p>
              {clientCount === 0 && <div className="mt-2"><AddClientDialog /></div>}
            </div>
          )}
        </CardContent>
      </Card>

      {clientCount > 0 && (
        <section aria-label="Client actions" className="flex flex-wrap justify-end gap-2">
          <Link href="/clients" className={buttonVariants({ variant: "outline" })}>
            <Users aria-hidden="true" /> Manage clients
          </Link>
          <AddClientDialog />
        </section>
      )}
    </>
  );
}
