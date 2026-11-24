"use client";

import { useState, type FormEvent } from "react";
import { Download, FileCode, Printer } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ReportFilters } from "./report-data";

const ledgerFields = [
  ["purchase", "Purchase ledger"],
  ["cgst", "Input CGST ledger"],
  ["sgst", "Input SGST ledger"],
  ["igst", "Input IGST ledger"],
  ["adjustment", "Adjustment ledger"],
] as const;

export function ReportActions({ filters }: { filters: ReportFilters }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const query = new URLSearchParams(Object.entries(filters));

  async function exportTally(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ledgers = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters, ledgers }),
      });
      if (!response.ok) {
        setError(response.status < 500 ? await response.text() : "Could not generate the export. Try again.");
        return;
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "tally-purchase-vouchers.xml";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("Could not download the export. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 print:hidden">
      <div className="flex flex-wrap gap-2">
        <a className={buttonVariants()} href={`/reports/export?${query}`} download>
          <Download aria-hidden="true" /> Download CSV
        </a>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer aria-hidden="true" /> Save as PDF
        </Button>
      </div>
      <details className="rounded-lg border px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium">TallyPrime XML</summary>
        {filters.client ? (
          <form onSubmit={exportTally} className="mt-3 space-y-3">
            <p className="text-sm text-muted-foreground">
              Use existing ledger names from the target TallyPrime company. Supplier names must match party ledgers.
              Fill in tax ledgers used by these invoices and an adjustment ledger if totals differ from taxable value plus tax.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ledgerFields.map(([name, label]) => (
                <div className="space-y-1.5" key={name}>
                  <Label htmlFor={`report-${name}`}>{label}</Label>
                  <Input id={`report-${name}`} name={name} maxLength={200} required={name === "purchase"} />
                </div>
              ))}
            </div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="outline" disabled={busy}>
                <FileCode aria-hidden="true" /> {busy ? "Preparing XML…" : "Download TallyPrime XML"}
              </Button>
              <a href="https://help.tallysolutions.com/import-data-from-xml-or-json/" target="_blank" rel="noreferrer" className="text-sm underline">
                TallyPrime import guide
              </a>
            </div>
          </form>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Filter to one client to export vouchers for its TallyPrime company.</p>
        )}
      </details>
    </div>
  );
}
