import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { createRequire } from "node:module";

// Isolate tests from local credentials and services before importing core.
Object.assign(process.env, {
  DATABASE_URL: "postgresql://test:test@localhost/test",
  VERIFY_TOKEN: "test", WHATSAPP_TOKEN: "test", PHONE_NUMBER_ID: "12345",
  WHATSAPP_BOT_NUMBER: "919999999999", GRAPH_API_VERSION: "v23.0", APP_SECRET: "test", WABA_ID: "test",
  REDIS_URL: "redis://localhost:6379", SUPABASE_BUCKET: "test", SUPABASE_REGION: "test",
  SUPABASE_ENDPOINT: "https://example.invalid", SUPABASE_ACCESS_KEY_ID: "test", SUPABASE_SECRET_ACCESS_KEY: "test",
  BETTER_AUTH_URL: "http://localhost:3000", BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret",
  GOOGLE_CLIENT_ID: "test", GOOGLE_CLIENT_SECRET: "test", WORKER_API_URL: "http://worker.invalid",
  WORKER_API_SECRET: "test",
});

// Match the web package's CommonJS loader so every module shares one DB boundary.
const require = createRequire(import.meta.url);
const { prisma } = require("../src/db");
const { Prisma } = require("../generated/prisma/client");
const { createClient, retryClientWelcome, recordWelcomeStatus } = require("../src/clients");
const { sendText, sendTextMessage } = require("../src/whatsapp");
const { buildWhatsAppInvitation, isCustomerServiceWindowOpen } = require("../src/whatsapp-session");
const { handleMessages, verfiyMetaSignature } = require("../../../apps/web/lib/webhook");

type Row = Record<string, any>;
let client: Row;
let messages: Map<string, Row>;
let bills: Row[];
let requests: { url: string; body: Row }[];
let queueFailures: number;
let sendFailures: number;
const restoreDelegates: (() => void)[] = [];

// Prisma delegates are proxies rather than ordinary method descriptors.
function stub(target: any, method: string, implementation: (...args: any[]) => any) {
  const original = target[method];
  target[method] = implementation;
  restoreDelegates.push(() => { target[method] = original; });
}

// A small in-memory database boundary, including conditional/atomic updates.
function matches(row: Row, where: Row): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (key === "OR") return value.some((branch: Row) => matches(row, branch));
    if (value && typeof value === "object" && !(value instanceof Date)) {
      return Object.entries(value).every(([operator, expected]: [string, any]) => {
        if (operator === "in") return expected.includes(row[key]);
        if (row[key] == null) return false;
        if (operator === "gt") return row[key] > expected;
        if (operator === "lt") return row[key] < expected;
        if (operator === "lte") return row[key] <= expected;
        throw new Error(`Unsupported test predicate: ${operator}`);
      });
    }
    if (value instanceof Date) return row[key]?.getTime() === value.getTime();
    return row[key] === value;
  });
}

beforeEach(() => {
  client = { id: "client-1", userId: "owner-1", legalName: "Client", gstin: "29ABCDE1234F1Z5",
    whatsappPhone: "919876543210", user: { name: "Accountant" }, connectedAt: null, lastInboundAt: null,
    welcomeStatus: "pending", welcomeAttemptAt: null, welcomeSentAt: null, welcomeMessageId: null, welcomeError: null };
  messages = new Map(); bills = []; requests = []; queueFailures = 0; sendFailures = 0;
  stub(prisma.client, "findUnique", async ({ where }: Row) => matches(client, where) ? structuredClone(client) : null);
  stub(prisma.client, "findFirst", async ({ where }: Row) => matches(client, where) ? structuredClone(client) : null);
  stub(prisma.client, "create", async ({ data }: Row) => ({ ...client, ...data }));
  stub(prisma.client, "updateMany", async ({ where, data }: Row) => {
    if (!matches(client, where)) return { count: 0 };
    Object.assign(client, data);
    return { count: 1 };
  });
  stub(prisma.waMessage, "create", async ({ data }: Row) => {
    if (messages.has(data.id)) throw new Prisma.PrismaClientKnownRequestError("duplicate", { code: "P2002", clientVersion: "test" });
    const row = { processedAt: null, ...data };
    messages.set(data.id, row);
    return row;
  });
  stub(prisma.waMessage, "findUnique", async ({ where }: Row) => messages.get(where.id) ?? null);
  stub(prisma.waMessage, "updateMany", async ({ where, data }: Row) => {
    const row = messages.get(where.id);
    if (!row || !matches(row, where)) return { count: 0 };
    Object.assign(row, data);
    return { count: 1 };
  });
  stub(prisma.waMessage, "update", async ({ where, data }: Row) => Object.assign(messages.get(where.id)!, data));
  stub(prisma.bill, "findFirst", async ({ where }: Row) => bills.find((bill) => matches(bill, where)) ?? null);
  stub(prisma.bill, "create", async ({ data }: Row) => {
    const bill = { id: `bill-${bills.length}`, status: "received", ...data };
    bills.push(bill);
    return bill;
  });
  mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    requests.push({ url: String(url), body: JSON.parse(options.body as string) });
    if (String(url).includes("worker.invalid")) {
      if (queueFailures-- > 0) return new Response("failed", { status: 503 });
      return Response.json({ ok: true });
    }
    if (sendFailures-- > 0) return Response.json({ error: { code: 131000 } }, { status: 500 });
    return Response.json({ messages: [{ id: `outgoing-${requests.length}` }] });
  });
});
afterEach(() => {
  for (const restore of restoreDelegates.splice(0)) restore();
  mock.restoreAll();
});

const incoming = (id = "incoming-1", overrides = {}) => ({
  id, from: "919876543210", timestamp: String(Math.floor(Date.now() / 1000)), type: "text" as const,
  text: { body: "Hi, start Billraklo" }, ...overrides,
});
const outgoing = () => requests.filter((request) => request.url.includes("graph.facebook.com"));
const welcomes = () => outgoing().filter((request) => request.body.text.body.includes("Welcome to Billraklo"));

test("invitation opens the bot chat with encoded text, never a client ID", () => {
  assert.equal(buildWhatsAppInvitation("+91 99999 99999"), "https://wa.me/919999999999?text=Hi%2C%20start%20Billraklo");
  assert.equal(buildWhatsAppInvitation(""), null);
  assert.equal(buildWhatsAppInvitation("12345"), null);
});

test("creating a client does not send any WhatsApp message", async () => {
  assert.equal((await createClient("owner-1", { legalName: "Client", gstin: client.gstin, whatsappPhone: client.whatsappPhone })).ok, true);
  assert.equal(requests.length, 0);
});

test("first Hi connects the registered sender and sends only a normal welcome", async () => {
  await handleMessages([incoming()]);
  assert.ok(client.connectedAt);
  assert.ok(client.lastInboundAt);
  assert.equal(client.welcomeStatus, "sent");
  assert.equal(outgoing().length, 1);
  assert.equal(outgoing()[0].body.type, "text");
  assert.equal(welcomes().length, 1);
  assert.equal(bills.length, 0);
});

test("unknown sender cannot activate a client or receive a welcome", async () => {
  await handleMessages([incoming("unknown", { from: "918888888888" })]);
  assert.equal(client.connectedAt, null);
  assert.equal(requests.length, 0);
});

test("replayed message is ignored without losing subsequent messages in a batch", async () => {
  await handleMessages([incoming()]);
  await handleMessages([incoming(), incoming("incoming-2")]);
  assert.equal(welcomes().length, 1);
  assert.equal(outgoing().length, 2);
  assert.ok(messages.get("incoming-2")?.processedAt);
});

test("simultaneous first messages claim only one welcome", async () => {
  await Promise.all([handleMessages([incoming("a")]), handleMessages([incoming("b")])]);
  assert.equal(welcomes().length, 1);
});

test("a first image connects the client and still queues the invoice", async () => {
  await handleMessages([{ id: "image", from: client.whatsappPhone, timestamp: incoming().timestamp,
    type: "image", image: { id: "media-1", mime_type: "image/jpeg", sha256: "hash" } }]);
  assert.equal(welcomes().length, 1);
  assert.equal(bills.length, 1);
  assert.equal(bills[0].waMediaId, "media-1");
  assert.equal(requests.filter((request) => request.url.includes("worker.invalid")).length, 1);
});

test("failed queue delivery is retryable without another bill or welcome", async () => {
  queueFailures = 1;
  const message = { id: "pdf", from: client.whatsappPhone, timestamp: incoming().timestamp,
    type: "document" as const, document: { id: "pdf-1", mime_type: "application/pdf", sha256: "hash" } };
  await assert.rejects(handleMessages([message]), /Couldn't queue/);
  assert.equal(messages.get("pdf")?.processedAt, null);
  await handleMessages([message]);
  assert.equal(bills.length, 1);
  assert.equal(welcomes().length, 1);
  assert.ok(messages.get("pdf")?.processedAt);
});

test("delayed messages do not reopen a closed window", async () => {
  await handleMessages([incoming("old", { timestamp: String(Math.floor(Date.now() / 1000) - 90_000) })]);
  assert.ok(client.connectedAt);
  assert.equal(outgoing().length, 0);
  assert.equal(client.welcomeStatus, "pending");
});

test("out-of-order messages do not shorten the latest reply window", async () => {
  await handleMessages([incoming()]);
  const latest = client.lastInboundAt.getTime();
  await handleMessages([incoming("older", { timestamp: String(Math.floor(latest / 1000) - 300) })]);
  assert.equal(client.lastInboundAt.getTime(), latest);
  assert.equal(welcomes().length, 1);
});

test("window closes at exactly 24h and both text send functions suppress delivery", async () => {
  const now = Date.now();
  assert.equal(isCustomerServiceWindowOpen(new Date(now - 86_400_000), now), false);
  assert.equal(isCustomerServiceWindowOpen(new Date(now - 86_399_999), now), true);
  assert.equal(isCustomerServiceWindowOpen(new Date(now + 1), now), false);
  client.lastInboundAt = new Date(now - 86_400_000);
  await sendText(client.whatsappPhone, "Delayed result");
  assert.equal((await sendTextMessage(client.whatsappPhone, "Welcome")).ok, false);
  assert.equal(requests.length, 0);
});

test("welcome retries require ownership and an open window", async () => {
  assert.deepEqual(await retryClientWelcome("other-owner", client.id, "Other"), { ok: false, reason: "not-found" });
  assert.deepEqual(await retryClientWelcome("owner-1", client.id, "Owner"), { ok: false, reason: "window-closed" });
  assert.equal(requests.length, 0);
});

test("failed welcome can be retried inside the window", async () => {
  sendFailures = 1;
  await handleMessages([incoming()]);
  assert.equal(client.welcomeStatus, "failed");
  assert.ok(client.connectedAt);
  const result = await retryClientWelcome("owner-1", client.id, "Owner");
  assert.ok(result.ok && result.result.ok);
  assert.equal(client.welcomeStatus, "sent");
});

test("delivery status cannot regress from read to sent or failed", async () => {
  await handleMessages([incoming()]);
  await recordWelcomeStatus(client.welcomeMessageId, "read");
  await recordWelcomeStatus(client.welcomeMessageId, "sent");
  await recordWelcomeStatus(client.welcomeMessageId, "failed");
  assert.equal(client.welcomeStatus, "read");
});

test("invalid webhook signatures are rejected", async () => {
  assert.equal(await verfiyMetaSignature(Buffer.from("{}"), "sha256=invalid", "test"), false);
});
