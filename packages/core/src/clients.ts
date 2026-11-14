import { z } from "zod";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "./db";
import { env } from "./env";
import { normalizeIndianMobile } from "./phone";
import { describeWhatsAppError, sendTemplate, type WhatsAppSendResult } from "./whatsapp";

// 2 digits state code, 10 character PAN, entity number, "Z", checksum.
const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const clientInputSchema = z.object({
  legalName: z
    .string()
    .trim()
    .min(2, "Enter the client's legal name.")
    .max(200, "Keep the legal name under 200 characters."),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(GSTIN, "Enter a valid 15-character GSTIN, e.g. 29ABCDE1234F1Z5."),
  whatsappPhone: z.string().transform((value, ctx) => {
    const phone = normalizeIndianMobile(value);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "Enter a 10-digit Indian mobile number." });
      return z.NEVER;
    }
    return phone;
  }),
});

export type ClientInput = z.infer<typeof clientInputSchema>;
export type ClientField = keyof ClientInput;

export function parseClientInput(input: Record<ClientField, unknown>) {
  const result = clientInputSchema.safeParse({
    legalName: String(input.legalName ?? ""),
    gstin: String(input.gstin ?? ""),
    whatsappPhone: String(input.whatsappPhone ?? ""),
  });
  if (result.success) return { success: true as const, data: result.data };

  const fieldErrors: Partial<Record<ClientField, string>> = {};
  for (const [field, messages] of Object.entries(z.flattenError(result.error).fieldErrors)) {
    if (messages?.[0]) fieldErrors[field as ClientField] = messages[0];
  }
  return { success: false as const, fieldErrors };
}

export function listClients(userId: string) {
  return prisma.client.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      legalName: true,
      gstin: true,
      whatsappPhone: true,
      createdAt: true,
      // welcomeError stays server-side: it's for debugging, not for users.
      welcomeStatus: true,
      _count: { select: { bills: true } },
    },
  });
}

function isPrismaError(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

/** Saves a client. `whatsappPhone` is unique across all users, so a number can only belong to one. */
export async function createClient(userId: string, input: ClientInput) {
  try {
    const client = await prisma.client.create({ data: { userId, ...input } });
    return { ok: true as const, client };
  } catch (error) {
    if (!isPrismaError(error, "P2002")) throw error;
    const existing = await prisma.client.findUnique({
      where: { whatsappPhone: input.whatsappPhone },
      select: { userId: true },
    });
    return { ok: false as const, reason: existing?.userId === userId ? ("already-yours" as const) : ("taken" as const) };
  }
}

/** Deletes a client the user owns. Refuses while bills still point at it. */
export async function removeClient(userId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
    select: { id: true, _count: { select: { bills: true } } },
  });
  if (!client) return { ok: false as const, reason: "not-found" as const };
  if (client._count.bills > 0) return { ok: false as const, reason: "has-bills" as const, bills: client._count.bills };

  try {
    await prisma.client.delete({ where: { id: client.id } });
  } catch (error) {
    // A bill arrived between the check and the delete.
    if (isPrismaError(error, "P2003")) return { ok: false as const, reason: "has-bills" as const, bills: 1 };
    // Already deleted, e.g. from another tab.
    if (isPrismaError(error, "P2025")) return { ok: true as const };
    throw error;
  }
  return { ok: true as const };
}

/**
 * Sends the welcome template to a client and records the outcome on the client row.
 * Never throws, so the caller can always report what happened.
 */
export async function sendClientWelcome(
  client: { id: string; whatsappPhone: string },
  addedBy: string,
): Promise<WhatsAppSendResult> {
  const result = await sendTemplate(client.whatsappPhone, {
    name: env.WHATSAPP_WELCOME_TEMPLATE,
    language: env.WHATSAPP_WELCOME_TEMPLATE_LANG,
    parameters: { user: addedBy },
  });

  if (!result.ok) {
    console.error(`[whatsapp] Welcome to client ${client.id} failed: ${withCode(result.reason, result.code)}`);
  }

  try {
    await prisma.client.update({
      where: { id: client.id },
      data: result.ok
        ? { welcomeStatus: "sent", welcomeMessageId: result.messageId, welcomeError: null, welcomeSentAt: new Date() }
        : { welcomeStatus: "failed", welcomeError: withCode(result.reason, result.code) },
    });
  } catch (error) {
    // The message outcome is still returned; only the stored status is stale.
    console.error(`Couldn't record welcome status for client ${client.id}:`, error);
  }
  return result;
}

/** Resends the welcome unless it already went out. */
export async function retryClientWelcome(userId: string, clientId: string, addedBy: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
    select: { id: true, whatsappPhone: true, welcomeStatus: true },
  });
  if (!client) return { ok: false as const, reason: "not-found" as const };
  if (client.welcomeStatus !== "pending" && client.welcomeStatus !== "failed") {
    return { ok: false as const, reason: "already-sent" as const };
  }
  return { ok: true as const, result: await sendClientWelcome(client, addedBy) };
}

// Status webhooks can arrive out of order (e.g. "read" before "delivered").
const statusRank: Record<string, number> = { pending: 0, sent: 1, delivered: 2, read: 3 };

/**
 * Applies a WhatsApp status webhook to the client whose welcome it belongs to.
 * Returns false when the message isn't a welcome message.
 */
export async function recordWelcomeStatus(
  messageId: string,
  status: string,
  error?: { code?: number; details?: string },
) {
  const client = await prisma.client.findUnique({
    where: { welcomeMessageId: messageId },
    select: { id: true, welcomeStatus: true },
  });
  if (!client) return false;

  if (status === "failed") {
    const reason = withCode(describeWhatsAppError(error?.code, error?.details), error?.code);
    console.error(`[whatsapp] Welcome to client ${client.id} failed after sending: ${reason}`);
    await prisma.client.update({
      where: { id: client.id },
      data: { welcomeStatus: "failed", welcomeError: reason },
    });
    return true;
  }

  const next = statusRank[status];
  const current = statusRank[client.welcomeStatus];
  if (next !== undefined && current !== undefined && next > current) {
    await prisma.client.update({ where: { id: client.id }, data: { welcomeStatus: status } });
  }
  return true;
}

function withCode(reason: string, code: number | null | undefined) {
  return code != null ? `${reason} (error ${code})` : reason;
}
