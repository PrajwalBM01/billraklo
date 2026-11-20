import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
        <span className="font-heading text-lg font-semibold tracking-tight">Billraklo</span>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Billraklo</h1>
          <p className="text-muted-foreground">Collect and organise your clients&apos; bills.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/sign-in" className={buttonVariants({ variant: "outline" })}>
            Sign in
          </Link>
          <Link href="/sign-up" className={buttonVariants()}>
            Create account
          </Link>
        </div>
      </main>
    </div>
  );
}
