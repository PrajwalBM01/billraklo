"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MailIcon } from "lucide-react";
import { toast } from "sonner";
import { OtpInput } from "@/components/auth/otp-input";
import { ResendCodeButton } from "@/components/auth/resend-code-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useResetOnHide } from "@/hooks/use-reset-on-hide";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage, safeRedirect } from "@/lib/auth-errors";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const next = safeRedirect(searchParams.get("next"));

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
          <CardTitle className="text-xl">Verify your email</CardTitle>
          <CardDescription>Sign in with your email and password and we&apos;ll send you a code.</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/sign-in" className={buttonVariants()}>
            Go to sign in
          </Link>
        </CardFooter>
      </Card>
    );
  }

  async function verify(code: string) {
    setPending(true);
    setError(null);
    const { error } = await authClient.emailOtp.verifyEmail({ email, otp: code });

    if (error) {
      setPending(false);
      setOtp("");
      setError(authErrorMessage(error));
      return;
    }

    // autoSignInAfterVerification creates the session, so go straight in.
    toast.success("Email verified");
    router.replace(next);
    router.refresh();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (otp.length === 6) void verify(otp);
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailIcon className="size-5" />
        </div>
        <CardTitle className="text-xl">Check your email</CardTitle>
        <CardDescription>
          We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field className="items-center">
            <FieldLabel htmlFor="otp" className="sr-only">
              Verification code
            </FieldLabel>
            <OtpInput id="otp" value={otp} onChange={setOtp} onComplete={verify} disabled={pending} invalid={!!error} />
            {error && <FieldError className="text-center">{error}</FieldError>}
          </Field>
          <Button type="submit" className="w-full" disabled={pending || otp.length < 6}>
            {pending && <Spinner />}
            Verify email
          </Button>
          <div className="flex justify-center text-sm text-muted-foreground">
            Didn&apos;t get it?&nbsp;
            <ResendCodeButton
              onResend={() => authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" })}
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Wrong email?&nbsp;
        <Link href="/sign-up" className="text-foreground underline underline-offset-4">
          Start over
        </Link>
      </CardFooter>
    </Card>
  );
}
