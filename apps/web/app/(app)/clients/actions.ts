"use server";

import { refresh } from "next/cache";
import {
  createClient,
  parseClientInput,
  removeClient,
  retryClientWelcome,
  getClientInvitationUrl,
  formatIndianMobile,
  type ClientField,
} from "@billraklo/core";
import { requireSession } from "@/lib/session";

export type AddClientResult =
  | { ok: true; legalName: string; phone: string; invitationUrl: string }
  | { ok: false; fieldErrors?: Partial<Record<ClientField, string>>; error?: string };

// Server actions can be called directly with a POST, so each one re-checks the
// session and only touches clients owned by the signed-in user.

export async function addClientAction(input: Record<ClientField, string>): Promise<AddClientResult> {
  const { user } = await requireSession();

  const parsed = parseClientInput(input);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.fieldErrors };
  const invitationUrl = getClientInvitationUrl();
  if (!invitationUrl) {
    return { ok: false, error: "WhatsApp invitations aren't set up yet. Please contact your administrator." };
  }

  let created: Awaited<ReturnType<typeof createClient>>;
  try {
    created = await createClient(user.id, parsed.data);
  } catch (error) {
    console.error("Couldn't create client:", error);
    return { ok: false, error: "Couldn't save the client. Please try again." };
  }

  if (!created.ok) {
    return {
      ok: false,
      fieldErrors: {
        // Don't reveal anything about another user's client.
        whatsappPhone:
          created.reason === "already-yours"
            ? "This number is already in your clients."
            : "This number is already registered with Billraklo.",
      },
    };
  }

  refresh();

  return { ok: true, legalName: created.client.legalName, phone: formatIndianMobile(created.client.whatsappPhone), invitationUrl };
}

export async function retryWelcomeAction(clientId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user } = await requireSession();

  try {
    const retried = await retryClientWelcome(user.id, clientId, user.name);
    refresh();
    if (!retried.ok) {
      return {
        ok: false,
        error: retried.reason === "window-closed"
          ? "Ask the client to message Billraklo again, then retry the welcome."
          : retried.reason === "already-sent" ? "The welcome message was already sent or is being sent." : "Client not found.",
      };
    }
    if (retried.result.ok && "skipped" in retried.result) {
      return { ok: false, error: "The welcome is already being handled, or the reply window has closed. Refresh the list." };
    }
    return retried.result.ok
      ? { ok: true }
      : { ok: false, error: "Couldn't send the welcome message. Please try again later." };
  } catch (error) {
    console.error("Couldn't retry welcome:", error);
    return { ok: false, error: "Couldn't send the welcome message. Please try again." };
  }
}

export async function removeClientAction(clientId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { user } = await requireSession();

  try {
    const removed = await removeClient(user.id, clientId);
    refresh();
    if (removed.ok) return { ok: true };
    if (removed.reason === "has-bills") {
      return { ok: false, error: "This client has bills, so it can't be removed yet." };
    }
    return { ok: false, error: "Client not found. It may have been removed already." };
  } catch (error) {
    console.error("Couldn't remove client:", error);
    return { ok: false, error: "Couldn't remove the client. Please try again." };
  }
}
