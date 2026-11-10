"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { OtpInput } from "@/components/auth/otp-input";
import { PasswordInput } from "@/components/auth/password-input";
import { ResendCodeButton } from "@/components/auth/resend-code-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { resetFormOnHide, useResetOnHide } from "@/hooks/use-reset-on-hide";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

const MIN_PASSWORD_LENGTH = 8;

export function ResetPasswordForm() {
  const router = useRouter();
  const email = useSearchParams().get("email") ?? "";

  const [otp, setOtp] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useResetOnHide(() => {
    setOtp("");
    setPending(false);
    setError(null);
  });

  if (!email) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Reset your password</CardTitle>
          <CardDescription>Start by requesting a reset code for your email.</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/forgot-password" className={buttonVariants()}>
            Request a code
          </Link>
        </CardFooter>
      </Card>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const confirmPassword = String(form.get("confirmPassword"));

    if (otp.length < 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setPending(true);
    setError(null);
    // Creates the password login if the user only had Google until now.
    const { error } = await authClient.emailOtp.resetPassword({ email, otp, password });

    if (error) {
      setPending(false);
      setError(authErrorMessage(error));
      return;
    }

    toast.success("Password updated. Sign in with your new password.");
    router.replace("/sign-in");
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Set a new password</CardTitle>
        <CardDescription>
          Enter the code we sent to <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={resetFormOnHide} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field className="items-center">
            <FieldLabel htmlFor="otp" className="sr-only">
              Reset code
            </FieldLabel>
            <OtpInput id="otp" value={otp} onChange={setOtp} disabled={pending} />
            <div className="text-sm text-muted-foreground">
              <ResendCodeButton onResend={() => authClient.emailOtp.requestPasswordReset({ email })} />
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="password">New password</FieldLabel>
            <PasswordInput id="password" name="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required />
            <FieldDescription>At least {MIN_PASSWORD_LENGTH} characters.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
            <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required />
          </Field>
          {error && <FieldError>{error}</FieldError>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Spinner />}
            Reset password
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="text-foreground underline underline-offset-4">
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
