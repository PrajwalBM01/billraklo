import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-muted/40 p-4 sm:p-8">
      <Link href="/" className="font-heading text-lg font-semibold tracking-tight">
        Billraklo
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
