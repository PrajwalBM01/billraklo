"use client";

import { useState } from "react";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useResetOnHide } from "@/hooks/use-reset-on-hide";
import { authClient } from "@/lib/auth-client";

export function SignOutButton({
  variant = "ghost",
  size = "sm",
}: Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  const [pending, setPending] = useState(false);
  useResetOnHide(() => setPending(false));

  async function handleClick() {
    setPending(true);
    await authClient.signOut();
    // A full page load, not a client navigation: Next.js keeps visited pages alive in
    // the background, and none of this user's pages or state should survive sign-out.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload is the point
    window.location.assign("/sign-in");
  }

  return (
    <Button variant={variant} size={size} disabled={pending} onClick={handleClick}>
      {pending ? <Spinner /> : <LogOutIcon />}
      Sign out
    </Button>
  );
}
