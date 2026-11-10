import { env } from "./env";

const baseURL = `https://graph.facebook.com/${env.GRAPH_API_VERSION}/${env.PHONE_NUMBER_ID}/messages`;

export async function sendText(to: string, body: string) {
  if (!env.WHATSAPP_TOKEN || !env.PHONE_NUMBER_ID || !env.GRAPH_API_VERSION) {
    throw new Error("Missing WhatsApp environment variables");
  }

  const url = `https://graph.facebook.com/${env.GRAPH_API_VERSION}/${env.PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: body,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`WhatsApp API error: ${JSON.stringify(data)}`);
  }

  console.log("Message sent:", data);
}

export type WhatsAppSendResult =
  | { ok: true; messageId: string }
  | { ok: false; code: number | null; reason: string };

const SEND_TIMEOUT_MS = 10_000;

// The parts of the Graph API's /messages response we read.
type GraphSendResponse = {
  messages?: { id: string }[];
  error?: { code?: number; message?: string; error_data?: { details?: string } };
};

/**
 * Sends an approved template, the only kind of message WhatsApp allows to a number
 * that hasn't messaged us in the last 24 hours. Never throws: failures come back as
 * a readable reason. `parameters` fill the template's named body variables, e.g.
 * { user: "Prajwal" } for {{user}}.
 */
export async function sendTemplate(
  to: string,
  template: { name: string; language: string; parameters?: Record<string, string> },
): Promise<WhatsAppSendResult> {
  const url = `https://graph.facebook.com/${env.GRAPH_API_VERSION}/${env.PHONE_NUMBER_ID}/messages`;
  const parameters = Object.entries(template.parameters ?? {}).map(([name, text]) => ({
    type: "text",
    parameter_name: name,
    text,
  }));

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
          name: "hello_world",
          language: { code: "en_US"},
        //   ...(parameters.length && { components: [{ type: "body", parameters }] }),
        },
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    console.error("WhatsApp template send failed:", error);
    return {
      ok: false,
      code: null,
      reason: timedOut ? "WhatsApp didn't respond in time." : "Couldn't reach WhatsApp. Check the server's internet connection.",
    };
  }

  const data = (await response.json().catch(() => null)) as GraphSendResponse | null;

  if (!response.ok) {
    const code = data?.error?.code ?? null;
    console.error("WhatsApp template send failed:", JSON.stringify(data));
    return { ok: false, code, reason: describeWhatsAppError(code, data?.error?.error_data?.details ?? data?.error?.message) };
  }

  const messageId = data?.messages?.[0]?.id;
  if (!messageId) {
    return { ok: false, code: null, reason: "WhatsApp accepted the request but returned no message ID." };
  }
  return { ok: true, messageId };
}

// Plain-English reasons for the WhatsApp error codes we're most likely to hit.
// https://developers.facebook.com/documentation/business-messaging/whatsapp/support/error-codes
const errorReasons: Record<number, string> = {
  190: "The WhatsApp access token is invalid or has expired. Create a new one in Meta and update WHATSAPP_TOKEN.",
  131030: "This number isn't on your test number's allowed list. Add it in the Meta dashboard under WhatsApp → API Setup.",
  131026: "This number can't receive WhatsApp messages. It may not be registered on WhatsApp.",
  131047: "WhatsApp only allows a template message here, because the client hasn't messaged in the last 24 hours.",
  131049: "Meta held this message back to protect the client's experience. Try again later.",
  132000: "The template's variables don't match. It should have one variable, {{user}}.",
  132001: "The welcome template doesn't exist or isn't approved yet in this language.",
  132012: "The template's variables are in a different format than expected. It should use the named variable {{user}}.",
  132015: "The welcome template is paused because of low quality. Edit it in WhatsApp Manager.",
  132016: "The welcome template is disabled. Create or fix it in WhatsApp Manager.",
  133010: "The sending phone number isn't registered with the WhatsApp Cloud API.",
  131042: "There's a billing problem on the WhatsApp Business account.",
  131031: "The WhatsApp Business account is locked or restricted.",
  368: "The WhatsApp Business account is temporarily blocked for policy violations.",
  130429: "Too many messages were sent too quickly. Try again in a minute.",
  131056: "Too many messages were sent to this number too quickly. Try again in a minute.",
  131000: "WhatsApp had a temporary problem. Try again.",
  131016: "WhatsApp is temporarily unavailable. Try again shortly.",
};

export function describeWhatsAppError(code: number | null | undefined, details?: string) {
  const reason = code != null ? errorReasons[code] : undefined;
  if (reason) return reason;
  if (details) return `WhatsApp rejected the message: ${details}`;
  return code != null ? `WhatsApp rejected the message (error ${code}).` : "WhatsApp rejected the message.";
}

// export async function downloadMedia(mediaId: string) {
//   const meta = await fetch(`${graph()}/${mediaId}`, { headers: auth() }).then(
//     (r) => r.json(),
//   );
//   const file = await fetch(meta.url, { headers: auth() });
//   return {
//     bytes: Buffer.from(await file.arrayBuffer()),
//     mimeType: meta.mime_type as string,
//   };
// }
