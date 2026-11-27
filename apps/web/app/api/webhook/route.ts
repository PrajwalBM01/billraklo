import { handleMessages, verfiyMetaSignature } from "@/lib/webhook";
import { NextRequest, NextResponse } from "next/server";
import { recordWelcomeStatus } from "@billraklo/core";
import { WebhookPayloadSchema } from "@/lib/webhook-types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = Buffer.from(await request.arrayBuffer());
    const signature = request.headers.get("x-hub-signature-256") || "";
    if (!(await verfiyMetaSignature(rawBody, signature, process.env.APP_SECRET!))) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const parsed = WebhookPayloadSchema.safeParse(JSON.parse(rawBody.toString("utf-8")));
    if (!parsed.success) {
      console.warn("Unknown WhatsApp webhook payload", parsed.error);
      return NextResponse.json({ success: true, unknown: true });
    }

    for (const entry of parsed.data.entry) {
      for (const change of entry.changes) {
        const value = change.value;
        if (value.metadata.phone_number_id !== process.env.PHONE_NUMBER_ID) continue;
        for (const status of value.statuses ?? []) {
          await recordWelcomeStatus(status.id, status.status, {
            code: status.errors?.[0]?.code,
            details: status.errors?.[0]?.error_data?.details,
          });
        }
        if (value.messages) await handleMessages(value.messages);
        if (value.errors) console.error("WhatsApp webhook errors", value.errors);
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing failed:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
