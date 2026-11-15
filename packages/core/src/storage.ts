import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "./env";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
env;

export const s3 = new S3Client({
  region: env.SUPABASE_REGION,
  endpoint: env.SUPABASE_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.SUPABASE_ACCESS_KEY_ID,
    secretAccessKey: env.SUPABASE_SECRET_ACCESS_KEY,
  },
});

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
) {
  const res = await s3.send(
    new PutObjectCommand({
      Bucket: env.SUPABASE_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return { key, etag: res.ETag ?? null };
}

export async function getObject(key: string): Promise<Buffer> {
  const res = await s3.send(
    new GetObjectCommand({ Bucket: env.SUPABASE_BUCKET, Key: key }),
  );
  if (!res.Body) throw new Error(`Empty object body for key ${key}`);
  return Buffer.from(await res.Body.transformToByteArray());
}

/** Short-lived URL for showing bills in the dashboard. Keep the bucket private. */
export async function signedUrl(key: string, expiresInSeconds = 300) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: env.SUPABASE_BUCKET, Key: key }),
    { expiresIn: expiresInSeconds },
  );
}