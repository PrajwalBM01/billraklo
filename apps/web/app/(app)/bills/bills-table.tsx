import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type BillRow = {
  id: string;
  clientName: string;
  status: string;
  receivedOn: string;
  kind: string;
  supplierName: string | null;
  invoiceNo: string | null;
  invoiceDate: string | null;
  amount: string | null;
  confidence: string | null;
};

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

// Processing statuses written by the webhook and worker.
const statusStyles: Record<string, { label: string; variant: BadgeVariant }> = {
  received: { label: "Received", variant: "outline" },
  stored: { label: "Stored", variant: "secondary" },
  extracting: { label: "Extracting", variant: "secondary" },
  extracted: { label: "Extracted", variant: "secondary" },
  needs_review: { label: "Needs review", variant: "outline" },
  confirmed: { label: "Confirmed", variant: "default" },
  duplicate: { label: "Duplicate", variant: "outline" },
  failed: { label: "Failed", variant: "destructive" },
};

const confidenceStyles: Record<string, { label: string; variant: BadgeVariant }> = {
  high: { label: "High", variant: "default" },
  medium: { label: "Medium", variant: "secondary" },
  low: { label: "Low", variant: "outline" },
};

export function BillsTable({ bills }: { bills: BillRow[] }) {
  return (
    <Card className="py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Bill</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Received</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="pr-4">Confidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.map((bill) => {
            const status = statusStyles[bill.status] ?? {
              label: bill.status.replace(/_/g, " "),
              variant: "outline" as const,
            };
            const confidence = bill.confidence ? confidenceStyles[bill.confidence] : null;

            return (
              <TableRow key={bill.id}>
                <TableCell className="pl-4">
                  <div className="flex flex-col">
                    <span className="font-medium">{bill.supplierName ?? "Processing bill"}</span>
                    <span className="text-xs text-muted-foreground">
                      {bill.invoiceNo ? `Invoice ${bill.invoiceNo}` : bill.kind}
                      {bill.invoiceDate ? ` · ${bill.invoiceDate}` : ""}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">{bill.clientName}</TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {bill.receivedOn}
                </TableCell>
                <TableCell className="text-right tabular-nums">{bill.amount ?? "—"}</TableCell>
                <TableCell className="pr-4">
                  {confidence ? (
                    <Badge variant={confidence.variant}>{confidence.label}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
