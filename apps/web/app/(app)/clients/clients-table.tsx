"use client";

import { useState, useTransition } from "react";
import { RotateCwIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useResetOnHide } from "@/hooks/use-reset-on-hide";
import { removeClientAction, retryWelcomeAction } from "./actions";

export type ClientRow = {
  id: string;
  legalName: string;
  gstin: string;
  phone: string;
  addedOn: string;
  welcomeStatus: string;
  bills: number;
};

const statusLabels: Record<string, { label: string; variant: "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Not sent", variant: "outline" },
  sent: { label: "Sent", variant: "secondary" },
  delivered: { label: "Delivered", variant: "secondary" },
  read: { label: "Read", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
};

export function ClientsTable({ clients }: { clients: ClientRow[] }) {
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [toRemove, setToRemove] = useState<ClientRow | null>(null);
  const [removing, startRemove] = useTransition();
  const [, startRetry] = useTransition();

  useResetOnHide(() => {
    setRetryingId(null);
    setToRemove(null);
  });

  function retry(client: ClientRow) {
    setRetryingId(client.id);
    startRetry(async () => {
      try {
        const result = await retryWelcomeAction(client.id);
        if (result.ok) toast.success(`Welcome message sent to ${client.legalName}.`);
        else toast.error(result.error);
      } catch {
        toast.error("Couldn't reach the server. Check your connection and try again.");
      } finally {
        setRetryingId(null);
      }
    });
  }

  function remove(client: ClientRow) {
    startRemove(async () => {
      try {
        const result = await removeClientAction(client.id);
        if (result.ok) {
          toast.success(`${client.legalName} removed.`);
          setToRemove(null);
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error("Couldn't reach the server. Check your connection and try again.");
      }
    });
  }

  return (
    <>
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Client</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Welcome</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="pr-4 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => {
              const status = statusLabels[client.welcomeStatus] ?? statusLabels.pending!;
              const canRetry = client.welcomeStatus === "pending" || client.welcomeStatus === "failed";

              return (
                <TableRow key={client.id}>
                  <TableCell className="pl-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{client.legalName}</span>
                      <span className="font-mono text-xs text-muted-foreground">{client.gstin}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{client.phone}</TableCell>
                  <TableCell>
                    <div className="flex max-w-64 flex-col items-start gap-1">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      {client.welcomeStatus === "failed" && (
                        <span className="text-xs whitespace-normal text-muted-foreground">
                          Couldn&apos;t send the welcome message.
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{client.addedOn}</TableCell>
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1">
                      {canRetry && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={retryingId !== null}
                          onClick={() => retry(client)}
                        >
                          {retryingId === client.id ? <Spinner /> : <RotateCwIcon />}
                          Retry
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${client.legalName}`}
                        onClick={() => setToRemove(client)}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog
        open={toRemove !== null}
        onOpenChange={(open) => {
          if (!open && !removing) setToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {toRemove?.legalName}?</AlertDialogTitle>
            <AlertDialogDescription>
              {toRemove && toRemove.bills > 0
                ? `This client has ${toRemove.bills} bill${toRemove.bills === 1 ? "" : "s"}, so it can't be removed yet.`
                : `Bills sent from ${toRemove?.phone} will no longer be accepted. You can add the client again later.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removing || (toRemove?.bills ?? 0) > 0}
              onClick={() => toRemove && remove(toRemove)}
            >
              {removing && <Spinner />}
              Remove client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
