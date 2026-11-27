"use client";

import { useState, useTransition } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useResetOnHide } from "@/hooks/use-reset-on-hide";
import { addClientAction, type AddClientResult } from "./actions";
import { InvitationDetails } from "./invitation";

type Values = { legalName: string; gstin: string; whatsappPhone: string };
type FieldErrors = Extract<AddClientResult, { ok: false }>["fieldErrors"];

const emptyValues: Values = { legalName: "", gstin: "", whatsappPhone: "" };

export function AddClientDialog() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Values>(emptyValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState<Extract<AddClientResult, { ok: true }> | null>(null);

  function reset() {
    setValues(emptyValues);
    setFieldErrors({});
    setError(null);
    setAdded(null);
  }

  // Close and clear the dialog if the user navigates away with it open.
  useResetOnHide(() => {
    setOpen(false);
    reset();
  });

  function handleOpenChange(next: boolean) {
    if (pending) return; // keep it open until the save finishes
    setOpen(next);
    if (!next) reset();
  }

  function update(field: keyof Values, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    setFieldErrors((e) => ({ ...e, [field]: undefined }));
  }

  // Keep digits only. Taking the last 10 also handles a pasted "+91 98765 43210".
  function updatePhone(raw: string) {
    const digits = raw.replace(/\D/g, "");
    update("whatsappPhone", digits.length > 10 ? digits.slice(-10) : digits);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      let result: AddClientResult;
      try {
        result = await addClientAction(values);
      } catch {
        setError("Couldn't reach the server. Check your connection and try again.");
        return;
      }

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setError(result.error ?? null);
        return;
      }

      setAdded(result);
      toast.success(`${result.legalName} added. Share their invitation to connect WhatsApp.`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        Add client
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{added ? `${added.legalName} added` : "Add a client"}</DialogTitle>
          <DialogDescription>
            {added ? "Waiting for your client to message Billraklo." : "Add their details, then share an invitation so they can connect to Billraklo on WhatsApp."}
          </DialogDescription>
        </DialogHeader>

        {added ? <InvitationDetails phone={added.phone} url={added.invitationUrl} /> : (
          <form id="add-client" onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Field data-invalid={!!fieldErrors?.legalName || undefined}>
              <FieldLabel htmlFor="legalName">Legal name</FieldLabel>
              <Input
                id="legalName"
                value={values.legalName}
                onChange={(e) => update("legalName", e.target.value)}
                placeholder="Sharma Traders Pvt Ltd"
                aria-invalid={!!fieldErrors?.legalName || undefined}
                autoComplete="organization"
                autoFocus
              />
              {fieldErrors?.legalName && <FieldError>{fieldErrors.legalName}</FieldError>}
            </Field>

            <Field data-invalid={!!fieldErrors?.gstin || undefined}>
              <FieldLabel htmlFor="gstin">GSTIN</FieldLabel>
              <Input
                id="gstin"
                value={values.gstin}
                onChange={(e) => update("gstin", e.target.value.toUpperCase().replace(/\s/g, ""))}
                placeholder="29ABCDE1234F1Z5"
                maxLength={15}
                autoCapitalize="characters"
                spellCheck={false}
                className="font-mono uppercase"
                aria-invalid={!!fieldErrors?.gstin || undefined}
              />
              {fieldErrors?.gstin && <FieldError>{fieldErrors.gstin}</FieldError>}
            </Field>

            <Field data-invalid={!!fieldErrors?.whatsappPhone || undefined}>
              <FieldLabel htmlFor="whatsappPhone">WhatsApp number</FieldLabel>
              <div className="flex">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                  +91
                </span>
                <Input
                  id="whatsappPhone"
                  type="tel"
                  inputMode="numeric"
                  value={values.whatsappPhone}
                  onChange={(e) => updatePhone(e.target.value)}
                  placeholder="98765 43210"
                  autoComplete="tel-national"
                  className="rounded-l-none"
                  aria-invalid={!!fieldErrors?.whatsappPhone || undefined}
                />
              </div>
              {fieldErrors?.whatsappPhone ? (
                <FieldError>{fieldErrors.whatsappPhone}</FieldError>
              ) : (
                <FieldDescription>10-digit Indian mobile number on WhatsApp.</FieldDescription>
              )}
            </Field>

            {error && <FieldError>{error}</FieldError>}
          </form>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => handleOpenChange(false)}>
            {added ? "Done" : "Cancel"}
          </Button>
          {!added && <Button type="submit" form="add-client" disabled={pending}>
            {pending && <Spinner />}
            {pending ? "Adding…" : "Add client"}
          </Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
