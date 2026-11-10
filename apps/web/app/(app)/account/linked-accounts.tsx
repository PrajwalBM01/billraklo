"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRoundIcon } from "lucide-react";
import { toast } from "sonner";
import { GoogleIcon } from "@/components/auth/google-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useResetOnHide } from "@/hooks/use-reset-on-hide";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

// connectedOn is formatted on the server so server and browser render the same text.
type LinkedAccount = { id: string; providerId: string; connectedOn: string };

const providers = [
  { id: "credential", name: "Email & password", icon: KeyRoundIcon },
  { id: "google", name: "Google", icon: GoogleIcon },
] as const;

export function LinkedAccounts({ accounts }: { accounts: LinkedAccount[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  useResetOnHide(() => setPending(null));
  const isLastMethod = accounts.length <= 1;

  async function connectGoogle() {
    setPending("google");
    // Redirects to Google; on failure Better Auth sends the user to /auth/error.
    const { error } = await authClient.linkSocial({ provider: "google", callbackURL: "/account" });
    if (error) {
      setPending(null);
      toast.error(authErrorMessage(error));
    }
  }

  async function disconnect(account: LinkedAccount) {
    setPending(account.providerId);
    const { error } = await authClient.unlinkAccount({ accountId: account.id });
    setPending(null);
    if (error) {
      toast.error(authErrorMessage(error));
      return;
    }
    toast.success("Google disconnected");
    router.refresh();
  }

  return (
    <ul className="flex flex-col divide-y rounded-lg border">
      {providers.map((provider) => {
        const account = accounts.find((a) => a.providerId === provider.id);
        const Icon = provider.icon;

        return (
          <li key={provider.id} className="flex items-center justify-between gap-4 p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md border bg-background">
                <Icon className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{provider.name}</span>
                <span className="text-xs text-muted-foreground">
                  {account ? `Connected ${account.connectedOn}` : "Not connected"}
                </span>
              </div>
            </div>

            {provider.id === "credential" ? (
              account ? (
                <Badge variant="secondary">Connected</Badge>
              ) : (
                <span className="text-xs text-muted-foreground">Add a password below</span>
              )
            ) : account ? (
              <Button
                variant="outline"
                size="sm"
                disabled={isLastMethod || pending !== null}
                title={isLastMethod ? "Add a password before disconnecting Google" : undefined}
                onClick={() => disconnect(account)}
              >
                {pending === provider.id && <Spinner />}
                Disconnect
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled={pending !== null} onClick={connectGoogle}>
                {pending === provider.id && <Spinner />}
                Connect
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
