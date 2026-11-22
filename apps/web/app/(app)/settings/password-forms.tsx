"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { resetFormOnHide, useResetOnHide } from "@/hooks/use-reset-on-hide";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { setPasswordAction, type SetPasswordState } from "./actions";

const MIN_PASSWORD_LENGTH = 8;

export function ChangePasswordForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useResetOnHide(() => {
    setPending(false);
    setError(null);
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const currentPassword = String(form.get("currentPassword"));
    const newPassword = String(form.get("password"));
    const confirmPassword = String(form.get("confirmPassword"));

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setPending(true);
    setError(null);
    const { error } = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
    setPending(false);

    if (error) {
      setError(authErrorMessage(error));
      return;
    }
    formElement.reset();
    toast.success("Password changed");
  }

  return (
    <form ref={resetFormOnHide} onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
        <PasswordInput id="currentPassword" name="currentPassword" autoComplete="current-password" required />
      </Field>
      <NewPasswordFields />
      {error && <FieldError>{error}</FieldError>}
      <Button type="submit" className="w-fit" disabled={pending}>
        {pending && <Spinner />}
        Change password
      </Button>
    </form>
  );
}

export function SetPasswordForm() {
  // useActionState can't be reset directly, so remount the form when the page is
  // hidden. Otherwise a stale error, or the success toast, would come back with it.
  const [formKey, setFormKey] = useState(0);
  useResetOnHide(() => setFormKey((key) => key + 1));

  return <SetPasswordFormInner key={formKey} />;
}

function SetPasswordFormInner() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<SetPasswordState, FormData>(setPasswordAction, {});

  useEffect(() => {
    if (state.ok) {
      toast.success("Password added. You can now sign in with your email and password.");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <NewPasswordFields />
      {state.error && <FieldError>{state.error}</FieldError>}
      <Button type="submit" className="w-fit" disabled={pending}>
        {pending && <Spinner />}
        Add password
      </Button>
    </form>
  );
}

function NewPasswordFields() {
  return (
    <>
      <Field>
        <FieldLabel htmlFor="password">New password</FieldLabel>
        <PasswordInput id="password" name="password" autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH} required />
        <FieldDescription>At least {MIN_PASSWORD_LENGTH} characters.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
        <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required />
      </Field>
    </>
  );
}
