import { timingSafeEqual } from "node:crypto";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import { getBillQueue, prisma } from "@billraklo/core";
import { auth, type AuthSession } from "./auth";
import { env } from "./env";

type Variables = {
  session: AuthSession;
};

export const api = new Hono<{ Variables: Variables }>();

api.use(
  "*",
  cors({
    origin: env.WEB_ORIGIN,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    maxAge: 600,
  }),
);

/**
 * Browser/user calls: validates the same Better Auth session cookie
 * the Next.js app set. Only session lookup, no auth routes here.
 */
const requireSession = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("session", session);
    await next();
  },
);

/**
 * Server-to-server calls (webhook, cron, etc.): no user session exists,
 * so trust a shared secret instead. Never expose this key to the browser.
 */
const requireServiceKey = createMiddleware(async (c, next) => {
  const provided = Buffer.from(c.req.header("x-api-key") ?? "");
  const expected = Buffer.from(env.WORKER_API_SECRET);

  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});

const enqueueBillBody = z.object({
  billId: z.string().min(1),
  action: z.enum(["process", "extract"]).default("process"),
});

function enqueueBill(billId: string, action: "process" | "extract") {
  return getBillQueue().add(
    action,
    { billId },
    // Completed jobs are kept for 24h, so a fixed jobId would make a
    // re-run silently do nothing. Suffix with time for a fresh job.
    { jobId: `${action}-${billId}-${Date.now()}` },
  );
}

// ---------------------------------------------------------------------------
// User route: requires a valid Better Auth session + bill ownership.
// ---------------------------------------------------------------------------
api.post("/api/queue/bills", requireSession, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = enqueueBillBody.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      400,
    );
  }

  const { billId, action } = parsed.data;
  const { user } = c.get("session");

  // A valid session is not enough: the bill must belong to this user.
  const bill = await prisma.bill.findFirst({
    where: {
      id: billId,
      client: { userId: user.id },
    },
    select: { id: true, status: true },
  });

  if (!bill) {
    return c.json({ error: "Bill not found" }, 404);
  }

  const job = await enqueueBill(bill.id, action);

  return c.json(
    {
      jobId: job.id,
      billId: bill.id,
      action,
      status: bill.status,
    },
    202,
  );
});

// ---------------------------------------------------------------------------
// Internal route: server-to-server only (WhatsApp webhook, cron, etc.).
// ---------------------------------------------------------------------------
api.post("/api/internal/queue/bills", requireServiceKey, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = enqueueBillBody.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      400,
    );
  }

  const { billId, action } = parsed.data;

  const bill = await prisma.bill.findUnique({
    where: { id: billId },
    select: { id: true, status: true },
  });

  if (!bill) {
    return c.json({ error: "Bill not found" }, 404);
  }

  const job = await enqueueBill(bill.id, action);

  return c.json(
    {
      jobId: job.id,
      billId: bill.id,
      action,
      status: bill.status,
    },
    202,
  );
});

api.get("/health", (c) => c.json({ ok: true }));