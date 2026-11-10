import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCardSkeleton } from "@/components/auth/auth-card-skeleton";
import { AuthErrorCard } from "./auth-error-card";

export const metadata: Metadata = { title: "Sign-in problem · Billraklo" };

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <AuthErrorCard />
    </Suspense>
  );
}
