"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { resetFormOnHide, useResetOnHide } from "@/hooks/use-reset-on-hide";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage, safeRedirect } from "@/lib/auth-errors";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeRedirect(searchParams.get("next"));

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useResetOnHide(() => {
    setPending(false);
    setError(null);
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));

    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.email({ email, password });

    if (error) {
      setPending(false);
      if (error.code === "EMAIL_NOT_VERIFIED") {
        // Better Auth has just emailed a fresh code (emailVerification.sendOnSignIn).
        const params = new URLSearchParams({ email, next });
        router.push(`/verify-email?${params}`);
        return;
      }
      setError(authErrorMessage(error));
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your Billraklo account</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup className="gap-5">
          <GoogleButton callbackURL={next} />
          <FieldSeparator>or</FieldSeparator>
          <form ref={resetFormOnHide} onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
            </Field>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Link href="/forgot-password" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput id="password" name="password" autoComplete="current-password" required />
            </Field>
            {error && <FieldError>{error}</FieldError>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending && <Spinner />}
              Sign in
            </Button>
          </form>
        </FieldGroup>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Don&apos;t have an account?&nbsp;
        <Link href="/sign-up" className="text-foreground underline underline-offset-4">
          Sign up
        </Link>
      </CardFooter>
    </Card>
  );
}
