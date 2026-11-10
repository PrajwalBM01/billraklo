import type { Metadata } from "next";
import { Suspense } from "react";
import { UsersIcon } from "lucide-react";
import { formatIndianMobile, listClients } from "@billraklo/core";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { AddClientDialog } from "./add-client-dialog";
import { ClientsTable } from "./clients-table";

export const metadata: Metadata = { title: "Clients · Billraklo" };

export default function ClientsPage() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Each client gets a WhatsApp welcome and can then forward their bills to Billraklo.
          </p>
        </div>
        <AddClientDialog />
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
        <ClientList />
      </Suspense>
    </>
  );
}

async function ClientList() {
  const { user } = await requireSession();
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
            Add your first client with their WhatsApp number. Billraklo will message them right away.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Formatted here so the server and browser render identical text.
  return (
    <ClientsTable
      clients={clients.map((client) => ({
        id: client.id,
        legalName: client.legalName,
        gstin: client.gstin,
        phone: formatIndianMobile(client.whatsappPhone),
        addedOn: formatDate(client.createdAt),
        welcomeStatus: client.welcomeStatus,
        bills: client._count.bills,
      }))}
    />
  );
}
