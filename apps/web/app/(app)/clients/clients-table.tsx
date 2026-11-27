"use client";

import { useState, useTransition } from "react";
import { CopyIcon, RotateCwIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { InvitationDetails, invitationText } from "./invitation";

export type ClientRow = {
  id: string;
  legalName: string;
  gstin: string;
  phone: string;
  addedOn: string;
  welcomeStatus: string;
  connected: boolean;
  canRetryWelcome: boolean;
  bills: number;
};

const statusLabels: Record<string, { label: string; variant: "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Welcome pending", variant: "outline" },
  sending: { label: "Sending welcome", variant: "outline" },
  sent: { label: "Welcome sent", variant: "secondary" },
  delivered: { label: "Welcome delivered", variant: "secondary" },
  read: { label: "Welcome read", variant: "secondary" },
  failed: { label: "Welcome failed", variant: "destructive" },
};

export function ClientsTable({ clients, invitationUrl }: { clients: ClientRow[]; invitationUrl: string | null }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [inviting, setInviting] = useState<ClientRow | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [toRemove, setToRemove] = useState<ClientRow | null>(null);
  const [removing, startRemove] = useTransition();
  const [, startRetry] = useTransition();

  useResetOnHide(() => {
    setRetryingId(null);
    setToRemove(null);
    setInviting(null);
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {invitationUrl ? "Share the invitation, then refresh to check whether your client has connected." : "WhatsApp invitations aren't set up yet. Please contact your administrator."}
        </p>
        <Button variant="outline" size="sm" disabled={refreshing} onClick={() => startRefresh(() => router.refresh())}>
          {refreshing ? <Spinner /> : <RotateCwIcon />} Refresh status
        </Button>
      </div>
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Client</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Connection</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="pr-4 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => {
              const status = statusLabels[client.welcomeStatus] ?? statusLabels.pending!;
              const canRetry = client.canRetryWelcome;

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
                      <Badge variant={client.connected ? "secondary" : "outline"}>
                        {client.connected ? "Connected" : "Waiting for client"}
                      </Badge>
                      {client.connected && <Badge variant={status.variant}>{status.label}</Badge>}
                      {client.connected && client.welcomeStatus === "failed" && (
                        <span className="text-xs whitespace-normal text-muted-foreground">
                          {canRetry ? "Couldn't send the welcome message. You can retry." : "Ask the client to message Billraklo again to retry the welcome."}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{client.addedOn}</TableCell>
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" disabled={!invitationUrl} onClick={async () => {
                        if (!invitationUrl) return;
                        try {
                          await navigator.clipboard.writeText(invitationText(client.phone, invitationUrl));
                          toast.success(`Invitation copied for ${client.legalName}. Paste it into your chat with them.`);
                        } catch {
                          setInviting(client);
                        }
                      }}>
                        <CopyIcon /> Copy invitation
                      </Button>
                      {canRetry && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={retryingId !== null}
                          onClick={() => retry(client)}
                        >
                          {retryingId === client.id ? <Spinner /> : <RotateCwIcon />}
                          Retry welcome
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

      <Dialog open={inviting !== null} onOpenChange={(open) => { if (!open) setInviting(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite {inviting?.legalName}</DialogTitle>
            <DialogDescription>Copy the invitation and send it to your client.</DialogDescription>
          </DialogHeader>
          {inviting && invitationUrl && <InvitationDetails phone={inviting.phone} url={invitationUrl} />}
        </DialogContent>
      </Dialog>

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
