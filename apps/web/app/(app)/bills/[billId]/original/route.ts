import { prisma, signedUrl } from "@billraklo/core";
import { getSession } from "@/lib/session";

export async function GET(_request: Request, { params }: { params: Promise<{ billId: string }> }) {
  const [session, { billId }] = await Promise.all([getSession(), params]);
  if (!session) return new Response(null, { status: 404 });

  const bill = await prisma.bill.findFirst({
    where: { id: billId, client: { userId: session.user.id } },
    select: { fileKey: true },
  });
  if (!bill?.fileKey) return new Response(null, { status: 404 });

  return new Response(null, {
    status: 307,
    headers: { Location: await signedUrl(bill.fileKey), "Cache-Control": "private, no-store" },
  });
}
