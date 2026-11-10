import { verfiyMetaSignature } from "@/lib/webhook";
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

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
    const result = await verfiyMetaSignature(
      rawBody,
      header,
      process.env.APP_SECRET!,
    );

    if (!result) {
      console.warn("Rejected webhook with invalid signature");
      return NextResponse.json(
        { success: false },
        {
          status: 401,
        },
      );
    }

    console.log("verfied");

    //parse the incoming event
    const bodyString = rawBody.toString("utf-8");
    const body = JSON.parse(bodyString);
    console.log("Webhook received:", body, bodyString);
    // Acknowledge Meta
    return NextResponse.json(
      { success: true },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Webhook error:", error);



//understand the system design behind otp login and create it



    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

// 4. Process incoming messages
async function handleIncomingMessage(body: any) {
  const changes =
    body.entry?.flatMap((entry: any) => entry.changes || []) || [];

  for (const change of changes) {
    const messages = change.value?.messages || [];

    for (const message of messages) {
      const from = message.from;
      const text = message.text?.body;

      if (!from || !text) {
        console.log("Non-text message received:", message.type);
        continue;
      }

      console.log(`${from}: ${text}`);

      await sendMessage(from, `You said: ${text}`);
    }
  }
}

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION;

export async function sendMessage(to: string, message: string) {
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID || !GRAPH_API_VERSION) {
    throw new Error("Missing WhatsApp environment variables");
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body: message,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`WhatsApp API error: ${JSON.stringify(data)}`);
  }

  console.log("Message sent:", data);

  return data;
}
