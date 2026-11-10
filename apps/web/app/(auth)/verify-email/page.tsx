import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCardSkeleton } from "@/components/auth/auth-card-skeleton";
import { VerifyEmailForm } from "./verify-email-form";

export const metadata: Metadata = { title: "Verify your email · Billraklo" };

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
