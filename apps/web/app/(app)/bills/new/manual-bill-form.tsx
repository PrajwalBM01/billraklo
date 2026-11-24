"use client";

import { useActionState, useRef, useState } from "react";
import { FileUp, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createManualBill } from "../actions";
import { manualUploadAccept, manualUploadMaxBytes } from "../review-fields";

export function ManualBillForm({ clients, selected }: {
  clients: { id: string; legalName: string }[];
  selected: string | null;
}) {
  const requestId = useRef<string | null>(null);
  const [client, setClient] = useState(selected);
  const [state, action, pending] = useActionState(async (previous: { error: string }, data: FormData) => {
    const file = data.get("file");
    if (file instanceof File && file.size > manualUploadMaxBytes) {
      return { error: "Choose a file up to 10 MB." };
    }
    if (client) data.set("client", client);
    requestId.current ??= crypto.randomUUID();
    data.set("requestId", requestId.current);
    return createManualBill(previous, data);
  }, { error: "" });
  const items = clients.map(({ id, legalName }) => ({ value: id, label: legalName }));

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field>
        <FieldLabel htmlFor="bill-client">Client</FieldLabel>
        <Select items={items} value={client} onValueChange={setClient} disabled={pending}>
          <SelectTrigger id="bill-client" className="w-full"><SelectValue placeholder="Choose a client" /></SelectTrigger>
          <SelectContent>
            {items.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor="bill-file">Original document (optional)</FieldLabel>
        <Input id="bill-file" type="file" name="file" accept={manualUploadAccept} aria-describedby="bill-file-hint" />
        <FieldDescription id="bill-file-hint">PDF, JPEG, PNG, or WebP. Up to 10 MB.</FieldDescription>
      </Field>
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="mode" value="upload" disabled={pending}>
          <FileUp /> {pending ? "Adding bill…" : "Upload and extract"}
        </Button>
        <Button type="submit" name="mode" value="manual" variant="outline" disabled={pending}>
          <PencilLine /> Enter details manually
        </Button>
      </div>
    </form>
  );
}
