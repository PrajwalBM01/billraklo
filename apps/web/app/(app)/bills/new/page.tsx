import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listClients } from "@billraklo/core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireSession } from "@/lib/session";
import { ManualBillForm } from "./manual-bill-form";

export const metadata = { title: "Add bill | Billraklo" };

type Props = { searchParams: Promise<{ client?: string | string[] }> };

export default function NewBillPage({ searchParams }: Props) {
  return (
    <>
      <header className="space-y-3">
        <Link href="/bills" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> Bills
        </Link>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Add bill</h1>
      </header>
      <Suspense fallback={<Skeleton className="h-56 w-full max-w-xl" />}>
        <ManualBillContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ManualBillContent({ searchParams }: Props) {
  const [{ user }, { client }] = await Promise.all([requireSession(), searchParams]);
  const clients = (await listClients(user.id)).map(({ id, legalName }) => ({ id, legalName }));
  const selected = clients.find(({ id }) => id === client)?.id ?? (clients.length === 1 ? clients[0].id : null);

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Bill source</CardTitle>
        <CardDescription>Upload a document for extraction or enter invoice details yourself.</CardDescription>
      </CardHeader>
      <CardContent>
        {clients.length ? (
          <ManualBillForm clients={clients} selected={selected} />
        ) : (
          <p className="text-sm">{"You'll need to "}<Link href="/clients" className="font-medium underline">add a client</Link> before adding a bill.</p>
        )}
      </CardContent>
    </Card>
  );
}
