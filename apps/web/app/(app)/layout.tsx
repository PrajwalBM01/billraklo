import { Suspense } from "react";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { UserAvatar } from "@/components/auth/user-avatar";
import { getSession } from "@/lib/session";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between gap-4 px-4">
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/dashboard" className="font-heading text-base font-semibold tracking-tight">
              Billraklo
            </Link>
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/account" className="text-muted-foreground hover:text-foreground">
              Account
            </Link>
          </nav>
          {/* The session is read per request, so it streams in behind a boundary. */}
          <Suspense fallback={<div className="size-8 rounded-full bg-muted" />}>
            <UserMenu />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 sm:p-8">{children}</main>
    </div>
  );
}

async function UserMenu() {
  const session = await getSession();
  if (!session) return null;

  return (
    <div className="flex items-center gap-2">
      <UserAvatar user={session.user} />
      <SignOutButton />
    </div>
  );
}
