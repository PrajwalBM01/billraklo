"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { resetFormOnHide, useResetOnHide } from "@/hooks/use-reset-on-hide";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useResetOnHide(() => {
    setPending(false);
    setError(null);
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email")).trim();

    setPending(true);
    setError(null);
    // Succeeds whether or not the email is registered, so accounts can't be probed.
    const { error } = await authClient.emailOtp.requestPasswordReset({ email });

    if (error) {
      setPending(false);
      setError(authErrorMessage(error));
      return;
    }

    router.push(`/reset-password?${new URLSearchParams({ email })}`);
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Forgot your password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a code to reset it. Signed up with Google? This also lets you add a
          password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={resetFormOnHide} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
          </Field>
          {error && <FieldError>{error}</FieldError>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Spinner />}
            Send reset code
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Remembered it?&nbsp;
        <Link href="/sign-in" className="text-foreground underline underline-offset-4">
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
