"use client";

import { useId } from "react";
import { CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function invitationText(phone: string, url: string) {
  return `I've added you to Billraklo to submit your bills and invoices. Open the link below using WhatsApp number ${phone}, then press Send on the prefilled message to connect. You can then send photos or PDFs of your invoices.\n\n${url}`;
}

export function InvitationDetails({ phone, url }: { phone: string; url: string }) {
  const id = useId();
  const text = invitationText(phone, url);
  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={id} className="text-sm font-medium">Share this invitation with your client</label>
      <textarea
        id={id}
        readOnly
        value={text}
        rows={7}
        onFocus={(event) => event.currentTarget.select()}
        className="w-full resize-none rounded-md border border-input bg-transparent p-3 text-sm"
      />
      <p className="text-sm text-muted-foreground">They must press Send from {phone}. Opening the link alone won&apos;t connect them.</p>
      <Button onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          toast.success("Invitation copied. Paste it into your chat with the client.");
        } catch {
          toast.error("Couldn't copy automatically. Select and copy the invitation above.");
        }
      }}>
        <CopyIcon /> Copy invitation
      </Button>
    </div>
  );
}
