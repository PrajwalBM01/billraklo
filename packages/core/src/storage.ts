import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";
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

export async function uploadToSupabase(
  bucketName: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string,
) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  try {
    const data = await s3.send(command);
    console.log("Upload successful!", data);
  } catch (error) {
    console.error("Error uploading file via S3:", error);
  }
}
