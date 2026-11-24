import Link from "next/link";
import { ArrowUpRight, Check, CircleAlert, ClipboardCheck, Clock3, FilePenLine, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
  canReview: boolean;
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
const statusStyles: Record<string, { label: string; variant: BadgeVariant; icon?: LucideIcon }> = {
  received: { label: "Waiting to process", variant: "outline", icon: Clock3 },
  stored: { label: "Queued for extraction", variant: "secondary", icon: Clock3 },
  extracting: { label: "Extracting details", variant: "secondary", icon: Clock3 },
  extracted: { label: "Ready for review", variant: "secondary", icon: ClipboardCheck },
  needs_review: { label: "Needs review", variant: "outline", icon: CircleAlert },
  confirmed: { label: "Reviewed", variant: "default", icon: Check },
  duplicate: { label: "Duplicate", variant: "outline" },
  failed: { label: "Extraction failed", variant: "destructive", icon: CircleAlert },
};

const confidenceStyles: Record<string, { label: string; variant: BadgeVariant }> = {
  high: { label: "High", variant: "default" },
  medium: { label: "Medium", variant: "secondary" },
  low: { label: "Low", variant: "outline" },
};

export function BillStatusBadge({ status, confidence }: { status: string; confidence: string | null }) {
  const needsReview = status === "extracted" && (confidence === "medium" || confidence === "low");
  const displayStatus = needsReview ? "needs_review" : status;
  const style = statusStyles[displayStatus];
  const Icon = style?.icon;

  return (
    <Badge variant={style?.variant ?? "outline"}>
      {Icon && <Icon aria-hidden="true" />}
      {style?.label ?? displayStatus.replace(/_/g, " ")}
    </Badge>
  );
}

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
            const confidence = bill.confidence ? confidenceStyles[bill.confidence] : null;
            const actionLabel = bill.canReview ? "Review bill" : bill.status === "confirmed" ? "View reviewed bill" : "View bill";
            const ActionIcon = bill.canReview ? FilePenLine : ArrowUpRight;

            return (
              <TableRow key={bill.id}>
                <TableCell className="py-3 pl-4">
                  <div className="flex flex-col gap-0.5">
                    {bill.supplierName && <span className="font-medium">{bill.supplierName}</span>}
                    <span className="text-xs text-muted-foreground">
                      {bill.invoiceNo ? `Invoice ${bill.invoiceNo}` : bill.kind}
                      {bill.invoiceDate ? ` · ${bill.invoiceDate}` : ""}
                    </span>
                    <Link
                      href={`/bills/${encodeURIComponent(bill.id)}`}
                      className={buttonVariants({ variant: bill.canReview ? "outline" : "ghost", size: "sm", className: "mt-1 w-fit" })}
                      aria-label={`${actionLabel} for ${bill.clientName}${bill.invoiceNo ? `, invoice ${bill.invoiceNo}` : ""}`}
                    >
                      <ActionIcon aria-hidden="true" />
                      {actionLabel}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">{bill.clientName}</TableCell>
                <TableCell>
                  <BillStatusBadge status={bill.status} confidence={bill.confidence} />
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
