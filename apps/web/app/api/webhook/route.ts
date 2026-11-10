import { isPhNoAllowed, verfiyMetaSignature } from "@/lib/webhook";
import { NextRequest, NextResponse } from "next/server";
import { recordWelcomeStatus, sendText } from "@billraklo/core";

// 1. Verify webhook with Meta
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("Webhook verified!");

    return new NextResponse(challenge, {
      status: 200,
    });
  }

  return new NextResponse("Forbidden", {
    status: 403,
  });
}

// 2. Receive incoming WhatsApp messages
export async function POST(request: NextRequest) {
  try {
    //recive the raw request
    const rawBody = Buffer.from(await request.arrayBuffer());

    const header = request.headers.get("x-hub-signature-256") || "";

    //verify
    const verifyed = await verfiyMetaSignature(
      rawBody,
      header,
      process.env.APP_SECRET!,
    );

    if (!verifyed) {
      console.warn("Rejected webhook with invalid signature");
      return NextResponse.json(
        { success: false },
        {
          status: 401,
        },
      );
    }

    //parse the incoming event
    const bodyString = rawBody.toString("utf-8");
    const body = JSON.parse(bodyString) as WebhookBody;

    //filer only messages and ignore the status(sent, recived, viewed)
    const changes = body.entry?.flatMap((entry) => entry.changes || []) || [];

    for (const change of changes) {
      // Delivery updates for messages we sent (sent, delivered, read, failed).
      // Never reply to these: each reply would trigger more of them.
      for (const status of change.value?.statuses || []) {
        try {
          await recordWelcomeStatus(status.id, status.status, {
            code: status.errors?.[0]?.code,
            details: status.errors?.[0]?.error_data?.details,
          });
        } catch (error) {
          console.error("Couldn't record message status:", error);
        }
      }

      const messages = change.value?.messages || [];

      for (const message of messages) {
        const from = message.from;
        const text = message.text?.body;

        if (!from || !text) {
          console.log("Non-text message received:", message.type);
          continue;
        }

        console.log(`${from}: ${text}`);

        //is phone number allowed
        const allowed = await isPhNoAllowed(from);

        if (!allowed) {
          console.error("Phone number not in clients list");
          continue;
        }

        try {
          await sendText(from, "recived");
        } catch (error) {
          console.error("Couldn't reply:", error);
        }
      }
    }
    console.log("Webhook received:", bodyString);

    // Acknowledge Meta
    return NextResponse.json(
      { success: true },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Webhook error:", error);

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

// The parts of Meta's webhook payload this route reads.
// https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks
type WebhookMessage = {
  from?: string;
  type?: string;
  text?: { body?: string };
};

type WebhookStatus = {
  id: string;
  status: string;
  errors?: { code?: number; error_data?: { details?: string } }[];
};

type WebhookBody = {
  entry?: {
    changes?: {
      value?: { messages?: WebhookMessage[]; statuses?: WebhookStatus[] };
    }[];
  }[];
};
