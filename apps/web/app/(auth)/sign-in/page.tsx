import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCardSkeleton } from "@/components/auth/auth-card-skeleton";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in · Billraklo" };

export default function SignInPage() {
  return (
    <Suspense fallback={<AuthCardSkeleton />}>
      <SignInForm />
    </Suspense>
  );
}
