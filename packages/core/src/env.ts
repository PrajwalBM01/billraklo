
import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // WhatsApp
  VERIFY_TOKEN: z.string().min(1, "VERIFY_TOKEN is required"),
  WHATSAPP_TOKEN: z.string().min(1, "WHATSAPP_TOKEN is required"),
  PHONE_NUMBER_ID: z.string().min(1, "PHONE_NUMBER_ID is required"),
  GRAPH_API_VERSION: z.string().min(1, "GRAPH_API_VERSION is required"),
  APP_SECRET: z.string().min(1, "APP_SECRET is required"),
  WABA_ID: z.string().min(1, "WABA_ID is required"),

  // Approved template used to message a client first (free text only works
  // within 24 hours of the client messaging us).
  WHATSAPP_WELCOME_TEMPLATE: z.string().min(1).default("client_welcome"),
  WHATSAPP_WELCOME_TEMPLATE_LANG: z.string().min(1).default("en"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:");

  console.error(
    z.treeifyError(parsedEnv.error)
  );

  throw new Error(
    "Missing or invalid environment variables. Check your .env.local file."
  );
}

export const env = parsedEnv.data;
