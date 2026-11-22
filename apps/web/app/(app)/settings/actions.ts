"use server";

import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { authErrorMessage } from "@/lib/auth-errors";

export type SetPasswordState = { error?: string; ok?: boolean };

const MIN_PASSWORD_LENGTH = 8;

// setPassword is server-only in Better Auth: it adds an email+password login to a
// user who signed up with Google, without needing a reset code.
export async function setPasswordAction(_prev: SetPasswordState, formData: FormData): Promise<SetPasswordState> {
  const newPassword = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  try {
    await auth.api.setPassword({ body: { newPassword }, headers: await headers() });
  } catch (error) {
    if (error instanceof APIError) {
      return { error: authErrorMessage({ code: error.body?.code, message: error.body?.message, status: error.statusCode }) };
    }
    throw error;
  }

  return { ok: true };
}
