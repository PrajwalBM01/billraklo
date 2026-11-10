"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TriangleAlertIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { oauthErrorMessage } from "@/lib/auth-errors";

export function AuthErrorCard() {
  const code = useSearchParams().get("error") ?? undefined;
  const { title, description } = oauthErrorMessage(code);

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <TriangleAlertIcon className="size-5" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {code && <p className="mt-1 font-mono text-xs text-muted-foreground">Error code: {code}</p>}
      </CardHeader>
      <CardFooter className="flex-col gap-2">
        <Link href="/sign-in" className={buttonVariants({ className: "w-full" })}>
          Back to sign in
        </Link>
        <Link href="/account" className={buttonVariants({ variant: "ghost", className: "w-full" })}>
          Go to account settings
        </Link>
      </CardFooter>
    </Card>
  );
}
