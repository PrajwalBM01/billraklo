import dotenv from "dotenv";
import { z } from "zod";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Always load packages/core/.env relative to this file
const currentDir = dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: resolve(currentDir, "../.env"),
});

const envSchema = z.object({
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1, "Google ai api key required"),
  EXTRACT_MODEL:z.string().min(1, "AI model requierd"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:");

  console.error(z.treeifyError(parsedEnv.error));

  throw new Error(
    "Missing or invalid environment variables. Check your .env.local file.",
  );
}

export const env = parsedEnv.data;
