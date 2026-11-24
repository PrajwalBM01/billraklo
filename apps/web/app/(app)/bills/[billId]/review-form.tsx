"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { saveBillReview } from "../actions";
import { emptyInvoice, emptyLine, type InvoiceFields, type LineFields } from "../review-fields";

const invoiceFields = [
  { field: "supplierName", label: "Supplier name", required: true },
  { field: "invoiceNo", label: "Invoice number" },
  { field: "invoiceDate", label: "Invoice date", type: "date", required: true },
  { field: "supplierGstin", label: "Supplier GSTIN" },
  { field: "buyerGstin", label: "Buyer GSTIN" },
  { field: "taxablePaise", label: "Taxable amount", decimal: true },
  { field: "cgstPaise", label: "CGST", decimal: true },
  { field: "sgstPaise", label: "SGST", decimal: true },
  { field: "igstPaise", label: "IGST", decimal: true },
  { field: "totalPaise", label: "Invoice total", decimal: true, required: true },
] as const;

const lineFields = [
  { field: "description", label: "Description", required: true },
  { field: "hsn", label: "HSN / SAC" },
  { field: "taxable", label: "Taxable amount", decimal: true, required: true },
  { field: "ratePct", label: "GST rate (%)", decimal: true },
] as const;

type DraftLine = LineFields & { key: string };
type DraftInvoice = Omit<InvoiceFields, "lines"> & { key: string; lines: DraftLine[] };
type Errors = Record<string, string>;

export function ReviewForm({ billId, status, entries, editable, processing }: {
  billId: string;
  status: string;
  entries: InvoiceFields[];
  editable: boolean;
  processing: boolean;
}) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [refreshing, startRefresh] = useTransition();
  const [issue, setIssue] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [invoices, setInvoices] = useState<DraftInvoice[]>(() =>
    (entries.length || !editable ? entries : [emptyInvoice]).map((entry, index) => ({
      ...entry,
      key: entry.id ?? String(index),
      lines: entry.lines.map((line, lineIndex) => ({ ...line, key: String(lineIndex) })),
    })),
  );

  function editInvoice(key: string, update: (invoice: DraftInvoice) => DraftInvoice) {
    setInvoices((current) => current.map((invoice) => invoice.key === key ? update(invoice) : invoice));
  }

  function updateStructure(update: (current: DraftInvoice[]) => DraftInvoice[]) {
    setErrors({});
    setIssue("");
    setInvoices(update);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIssue("");
    setErrors({});
    startSave(async () => {
      const result = await saveBillReview(billId, status, invoices);
      setIssue(result.error);
      setErrors(result.fields ?? {});
    });
  }

  return (
    <Card className="min-w-0">
      <CardHeader className="gap-x-2">
        <CardTitle><h2>Invoice details</h2></CardTitle>
        <CardDescription>
          {status === "confirmed"
            ? "Reviewed and final."
            : processing
              ? editable
                ? "Extraction is in progress. Refresh for results or enter the details yourself."
                : "Check back once extraction finishes."
              : editable ? "Check the details against the original. Amounts are in INR." : "This bill is closed."}
        </CardDescription>
        {processing && (
          <CardAction>
            <Button type="button" variant="outline" size="sm" disabled={refreshing || saving} onClick={() => startRefresh(() => router.refresh())}>
              <RefreshCw /> {refreshing ? "Checking…" : "Refresh"}
            </Button>
          </CardAction>
        )}
      </CardHeader>
      {invoices.length > 0 && (
        <CardContent>
          <form onSubmit={submit} noValidate className="space-y-5">
            <fieldset disabled={saving || refreshing} className="min-w-0 space-y-4">
              {invoices.map((invoice, index) => (
                <section key={invoice.key} aria-label={`Invoice ${index + 1}`} className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-medium">Invoice {index + 1}</h3>
                    {editable && invoices.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => updateStructure((current) => current.filter(({ key }) => key !== invoice.key))}>
                        <Trash2 /> Remove invoice
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {invoiceFields.map(({ field, label, ...props }) => (
                      <ReviewInput
                        key={field}
                        label={label}
                        value={invoice[field]}
                        readOnly={!editable}
                        error={errors[`${index}.${field}`]}
                        onChange={(value) => editInvoice(invoice.key, (current) => ({ ...current, [field]: value }))}
                        {...props}
                      />
                    ))}
                  </div>
                  <div className="space-y-3 border-t pt-4">
                    <h4 className="font-medium">Line items</h4>
                    {invoice.lines.length === 0 && <p className="text-sm text-muted-foreground">No line items.</p>}
                    {errors[`${index}.lines`] && <p className="text-sm text-destructive">{errors[`${index}.lines`]}</p>}
                    {invoice.lines.map((line, lineIndex) => (
                      <div key={line.key} className="space-y-2 rounded-lg bg-muted/40 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">Item {lineIndex + 1}</p>
                          {editable && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Remove line item ${lineIndex + 1}`}
                              onClick={() => {
                                setErrors({});
                                editInvoice(invoice.key, (current) => ({ ...current, lines: current.lines.filter(({ key }) => key !== line.key) }));
                              }}
                            >
                              <Trash2 />
                            </Button>
                          )}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {lineFields.map(({ field, label, ...props }) => (
                            <ReviewInput
                              key={field}
                              label={label}
                              value={line[field]}
                              readOnly={!editable}
                              error={errors[`${index}.lines.${lineIndex}.${field}`]}
                              onChange={(value) => editInvoice(invoice.key, (current) => ({
                                ...current,
                                lines: current.lines.map((item) => item.key === line.key ? { ...item, [field]: value } : item),
                              }))}
                              {...props}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    {editable && (
                      <Button type="button" variant="outline" size="sm" onClick={() => {
                        const line = { ...emptyLine, key: crypto.randomUUID() };
                        editInvoice(invoice.key, (current) => ({ ...current, lines: [...current.lines, line] }));
                      }}>
                        <Plus /> Add line item
                      </Button>
                    )}
                  </div>
                </section>
              ))}
              {editable && (
                <Button type="button" variant="outline" onClick={() => {
                  const entry = { ...emptyInvoice, key: crypto.randomUUID(), lines: [] };
                  updateStructure((current) => [...current, entry]);
                }}>
                  <Plus /> Add invoice
                </Button>
              )}
            </fieldset>
            {editable && (
              <div className="flex flex-col items-start gap-2 border-t pt-4">
                {issue && <p role="alert" className="text-sm text-destructive">{errors[""] ?? issue}</p>}
                <p className="text-xs text-muted-foreground">Saving marks this bill as reviewed and locks its invoice details.</p>
                <Button type="submit" disabled={saving || refreshing}>
                  <Check /> {saving ? "Saving…" : "Save and mark reviewed"}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      )}
    </Card>
  );
}

function ReviewInput({ label, value, required, readOnly, error, onChange, type = "text", decimal }: {
  label: string;
  value: string;
  required?: boolean;
  readOnly: boolean;
  error?: string;
  onChange: (value: string) => void;
  type?: string;
  decimal?: boolean;
}) {
  const id = useId();
  return (
    <Field data-invalid={!!error || undefined} className="gap-1.5">
      <FieldLabel htmlFor={id}>{label}{required && !readOnly ? " *" : ""}</FieldLabel>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        inputMode={decimal ? "decimal" : undefined}
        readOnly={readOnly}
        required={required && !readOnly}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}
