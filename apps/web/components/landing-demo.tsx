"use client";

import { CirclePlay, FileText, ScanLine, Table2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function LandingDemo() {
  return (
    <Dialog>
      <DialogTrigger className="dd-demo"><CirclePlay size={18} aria-hidden="true" /><span>Watch Demo</span></DialogTrigger>
      <DialogContent className="dd-demo-dialog max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>From documents to insights</DialogTitle>
          <DialogDescription>A quick walkthrough with an example invoice.</DialogDescription>
        </DialogHeader>
        <ol className="grid gap-6">
          <li className="flex gap-4"><FileText className="mt-1 shrink-0 text-emerald-600" aria-hidden="true" /><div><h3 className="font-semibold">Receive a document</h3><p className="mt-1 text-muted-foreground">A client sends Invoice-1048.pdf through WhatsApp.</p></div></li>
          <li className="flex gap-4"><ScanLine className="mt-1 shrink-0 text-emerald-600" aria-hidden="true" /><div><h3 className="font-semibold">Extract the details</h3><p className="mt-1 text-muted-foreground">Supplier: Papertrail Print Co.<br />Invoice total: ₹4,250.00</p></div></li>
          <li className="flex gap-4"><Table2 className="mt-1 shrink-0 text-emerald-600" aria-hidden="true" /><div><h3 className="font-semibold">Review and report</h3><p className="mt-1 text-muted-foreground">Review the extracted bill, find it by client, and export your report.</p></div></li>
        </ol>
      </DialogContent>
    </Dialog>
  );
}
