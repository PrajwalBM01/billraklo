import {
  handleMessages,
  isMessageProcessed,
  verfiyMetaSignature,
} from "@/lib/webhook";
import { NextRequest, NextResponse } from "next/server";
import {
  recordWelcomeStatus,
  sendText,
  prisma,
  getBillQueue,
} from "@billraklo/core";
import { WebhookPayloadSchema } from "@/lib/webhook-types";

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

    //parse the incoming webhook event
    console.log("Webhook received:", rawBody.toString("utf-8"));
    const body = JSON.parse(rawBody.toString("utf-8"));
    const parsedBody = WebhookPayloadSchema.safeParse(body);

    if (!parsedBody.success) {
      //parse failed means different body
      console.log(
        "Incoming payload unknown",
        parsedBody.error,
        parsedBody.data,
      );
      return NextResponse.json(
        { success: true, unknown: true },
        { status: 200 },
      );
    }

    //1. store the incoming message id and check idempotancy
    const processed = await isMessageProcessed(parsedBody.data);
    if (processed) {
      return NextResponse.json(
        { success: true, duplicate: true },
        { status: 200 },
      );
    }
    const value = parsedBody.data.entry[0].changes[0].value;

    //2. filter the incoming msg into status and message
    //handle statuses
    if (value.statuses) {
      for (const status of value.statuses ?? []) {
        try {
          await recordWelcomeStatus(status.id, status.status, {
            code: status.errors?.[0]?.code,
            details: status.errors?.[0]?.error_data?.details,
          });
        } catch (error) {
          console.error("Couldn't record message status:", error);
        }
      }
    }

    //handling messages
    if (value.messages) {
      await handleMessages(value.messages);
    }

    if (value.errors) {
      console.log("Something error came in webhook errors", value.errors);
    }


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
