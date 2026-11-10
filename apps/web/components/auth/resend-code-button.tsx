"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authErrorMessage } from "@/lib/auth-errors";

const COOLDOWN_SECONDS = 60;

export function ResendCodeButton({
  onResend,
  startOnMount = true,
}: {
  onResend: () => Promise<{ error: { code?: string; message?: string; status?: number } | null }>;
  // A code was usually just sent when the page opens, so start counting down.
  startOnMount?: boolean;
}) {
  const [secondsLeft, setSecondsLeft] = useState(startOnMount ? COOLDOWN_SECONDS : 0);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function handleClick() {
    setPending(true);
    const { error } = await onResend();
    setPending(false);
    if (error) {
      toast.error(authErrorMessage(error));
      return;
    }
    toast.success("We sent you a new code.");
    setSecondsLeft(COOLDOWN_SECONDS);
  }

  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      className="h-auto p-0"
      disabled={pending || secondsLeft > 0}
      onClick={handleClick}
    >
      {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : "Resend code"}
    </Button>
  );
}
