import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/auth/user-avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard · Billraklo" };

export default function DashboardPage() {
  return (
    <>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>
      <Suspense
        fallback={
          <Card>
            <CardContent className="flex h-28 items-center justify-center">
              <Spinner className="size-5 text-muted-foreground" />
            </CardContent>
          </Card>
        }
      >
        <Welcome />
      </Suspense>
    </>
  );
}

async function Welcome() {
  const { user } = await requireSession();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <UserAvatar user={user} size="lg" />
        <div className="flex flex-col gap-1">
          <CardTitle>Welcome, {user.name}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            {user.email}
            {user.emailVerified && <Badge variant="secondary">Verified</Badge>}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Link href="/account" className={buttonVariants({ variant: "outline", className: "w-fit" })}>
          Manage sign-in methods
        </Link>
      </CardContent>
    </Card>
  );
}
