import { prisma } from "@billraklo/core";
import crypto from "node:crypto";

export async function verfiyMetaSignature(
  rawBody: Buffer<ArrayBuffer>,
  header: string,
  secret: string,
) {
  //check header
  if (!header?.startsWith("sha256=")) return false;

  //recompute the signature
  const expected =
    "sha256=" +
    crypto
      .createHmac("sha256", secret)
      .update(rawBody || "")
      .digest("hex");

  //compare both the recived and genrated signature
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function isPhNoAllowed(number: string) {
  if (!number) return false;

  const existing = await prisma.client.findUnique({
    where: { whatsappPhone: number },
  });

  if (existing) {
    return true;
  } else {
    return false;
  }
}
