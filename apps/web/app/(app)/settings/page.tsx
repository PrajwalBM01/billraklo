import type { Metadata } from "next";
import { Suspense } from "react";
import { headers } from "next/headers";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { UserAvatar } from "@/components/auth/user-avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { LinkedAccounts } from "./linked-accounts";
import { ChangePasswordForm, SetPasswordForm } from "./password-forms";
import { ThemeSettings } from "./theme-settings";

export const metadata: Metadata = { title: "Settings · Billraklo" };

export default function SettingsPage() {
  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account, sign-in methods, and how Billraklo looks.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            System follows your device setting. Light and dark stay that way on this browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSettings />
        </CardContent>
      </Card>
      <Suspense
        fallback={
          <Card>
            <CardContent className="flex h-64 items-center justify-center">
              <Spinner className="size-5 text-muted-foreground" />
            </CardContent>
          </Card>
        }
      >
        <SettingsContent />
      </Suspense>
    </>
  );
}

async function SettingsContent() {
  const { user } = await requireSession();
  const accounts = await auth.api.listUserAccounts({ headers: await headers() });

  const hasPassword = accounts.some((a) => a.providerId === "credential");
  const linked = accounts.map((a) => ({
    id: a.id,
    providerId: a.providerId,
    connectedOn: formatDate(a.createdAt),
  }));

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <UserAvatar user={user} size="lg" />
          <div className="flex flex-col gap-1">
            <CardTitle>{user.name}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sign-in methods</CardTitle>
          <CardDescription>
            Email+password and Google share one account when they use the same email ({user.email}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LinkedAccounts accounts={linked} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{hasPassword ? "Change password" : "Add a password"}</CardTitle>
          <CardDescription>
            {hasPassword
              ? "Other devices will be signed out after you change it."
              : `You signed up with Google. Add a password to also sign in with ${user.email} and a password.`}
          </CardDescription>
        </CardHeader>
        <CardContent>{hasPassword ? <ChangePasswordForm /> : <SetPasswordForm />}</CardContent>
      </Card>

      <Card>
        <CardFooter className="justify-between gap-4">
          <p className="text-sm text-muted-foreground">Sign out of this device.</p>
          <SignOutButton variant="outline" />
        </CardFooter>
      </Card>
    </>
  );
}
