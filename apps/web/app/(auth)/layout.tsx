import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-muted/40 p-4 sm:p-8">
      <Link href="/" className="inline-flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
        <BrandLogo className="size-9 rounded-lg bg-[#e5f7ed]" />
        Billraklo
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
