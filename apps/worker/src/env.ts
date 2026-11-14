// import { z } from "zod";

// const envSchema = z.object({
//   REDIS_URL: z.string().min(1, "REDIES_URL is required"),
// });

// const parsedEnv = envSchema.safeParse(process.env);

// if (!parsedEnv.success) {
//   console.error("❌ Invalid environment variables:");

//   console.error(z.treeifyError(parsedEnv.error));

//   throw new Error("Missing or invalid environment variables in worker.");
// }

// export const env = parsedEnv.data;
