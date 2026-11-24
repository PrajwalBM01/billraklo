import { getSession } from "@/lib/session";
import { purchaseCsv, tallyLedgers, tallyXml } from "../export-formats";
import { getPurchaseRegister, reportFilters } from "../report-data";

function download(content: string, filename: string, type: string) {
  return new Response(content, {
    headers: {
      "Content-Type": `${type}; charset=utf-8`,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return new Response("Sign in to export reports.", { status: 401 });
  const filters = reportFilters.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!filters.success) return new Response("Invalid report filters.", { status: 400 });
  const rows = await getPurchaseRegister(session.user.id, filters.data);
  return download(purchaseCsv(rows), "purchase-register.csv", "text/csv");
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return new Response("Sign in to export reports.", { status: 401 });
  const body = await request.json().catch(() => null);
  const filters = reportFilters.safeParse(body?.filters);
  const ledgers = tallyLedgers.safeParse(body?.ledgers);
  if (!filters.success || !filters.data.client || !ledgers.success) {
    return new Response("Choose one client and enter a valid purchase ledger.", { status: 400 });
  }
  const rows = await getPurchaseRegister(session.user.id, filters.data);
  if (!rows.length) return new Response("No reviewed invoices match this report.", { status: 400 });
  const result = tallyXml(rows, ledgers.data);
  if (result.content === undefined) return new Response(result.error, { status: 422 });
  return download(result.content, "tally-purchase-vouchers.xml", "application/xml");
}
