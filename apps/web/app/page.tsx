import type { Metadata } from "next";
import { Bricolage_Grotesque, Public_Sans } from "next/font/google";
import Link from "next/link";
import {
  ArrowDown, ArrowDownRight, ArrowUpRight, Check, FileText, Files,
  MessageCircle, ReceiptText, ScanLine, Users,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const body = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans" });

export const metadata: Metadata = {
  description: "Collect client bills on WhatsApp, extract invoice details automatically, and see what needs review in one place.",
};

const startLink = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--lp-green)] px-5 py-2.5 text-sm font-bold text-[var(--lp-on-green)] hover:bg-[var(--lp-green-hover)]";
const displayHeading = "font-display font-semibold tracking-[-0.055em]";

const steps = [
  { icon: Users, title: "Add a client", description: "Enter their WhatsApp number. Billraklo sends a welcome message so they know where to send their bills." },
  { icon: MessageCircle, title: "They forward their bills", description: "Clients send invoice photos or PDFs through WhatsApp, right from their phone." },
  { icon: ScanLine, title: "Check your bills list", description: "Billraklo extracts details like the supplier, invoice number, date and total, and flags bills that need review." },
];

function Wordmark() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 font-display text-2xl font-bold tracking-tight">
      <span className="grid size-8 place-items-center rounded-lg bg-[var(--lp-green)] text-[var(--lp-on-green)]">
        <ReceiptText size={19} aria-hidden="true" />
      </span>
      Billraklo
    </Link>
  );
}

function BillPreview() {
  return (
    <figure className="docket min-w-0">
      <div className="overflow-hidden rounded-[1.65rem] border border-[var(--lp-rule-strong)] bg-[var(--lp-paper-raised)] shadow-[0_24px_65px_-42px_#0c3b2b80]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--lp-rule)] px-5 py-4 sm:px-7">
          <span className="inline-flex items-center gap-2 text-sm font-bold">
            <MessageCircle size={17} className="text-[var(--lp-green)]" aria-hidden="true" />
            WhatsApp
          </span>
          <span className="text-xs text-[var(--lp-ink-soft)]">Client message</span>
        </div>
        <div className="chat-paper flex justify-end px-5 py-7 sm:px-7">
          <div className="w-full max-w-[17rem] rounded-xl rounded-tr-sm bg-[var(--lp-bubble)] p-2.5 text-[var(--lp-bubble-ink)]">
            <div className="flex items-center gap-3 rounded-lg bg-[var(--lp-paper-raised)] p-3 text-[var(--lp-ink)]">
              <FileText size={21} className="shrink-0 text-[var(--lp-green)]" aria-hidden="true" />
              <span className="text-sm font-bold">Invoice-1048.pdf</span>
            </div>
            <p className="px-1 pt-2 text-xs">Here&apos;s the printing bill for November.</p>
          </div>
        </div>
        <div className="relative border-t border-[var(--lp-rule)] px-5 pb-5 pt-7 sm:px-7">
          <span className="absolute -top-4 left-5 grid size-8 place-items-center rounded-full bg-[var(--lp-green)] text-[var(--lp-on-green)] sm:left-7">
            <ArrowDown size={16} aria-hidden="true" />
          </span>
          <p className="flex items-center gap-2 text-sm font-bold">
            <Files size={16} className="text-[var(--lp-green)]" aria-hidden="true" /> Bills list
          </p>
          <dl className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-y border-[var(--lp-rule)] py-4">
            <div>
              <dt className="text-xs text-[var(--lp-ink-soft)]">Supplier</dt>
              <dd className="mt-1 text-sm font-bold sm:text-base">Papertrail Print Co.</dd>
            </div>
            <div className="text-right">
              <dt className="text-xs text-[var(--lp-ink-soft)]">Total</dt>
              <dd className="mt-1 text-sm font-bold tabular-nums sm:text-base">₹4,250.00</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[var(--lp-ink-soft)]">Client · Meera Studio</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--lp-green-soft)] px-2.5 py-1 font-semibold text-[var(--lp-green)]">
              <Check size={13} aria-hidden="true" /> Extracted
            </span>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-right text-xs text-[var(--lp-ink-soft)]">Illustrative bill</figcaption>
    </figure>
  );
}

export default function Home() {
  return (
    <div className={`landing ${display.variable} ${body.variable} flex flex-1 flex-col bg-[var(--lp-paper)] font-landing text-[var(--lp-ink)] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-[var(--lp-green)]`}>
      <header className="border-b border-[var(--lp-rule)]">
        <div className="mx-auto flex min-h-[4.75rem] w-full max-w-7xl items-center justify-between gap-3 px-5 sm:px-8 lg:px-12">
          <Wordmark />
          <nav aria-label="Main navigation" className="flex items-center gap-3 text-sm font-semibold sm:gap-6">
            <a href="#how-it-works" className="hidden hover:underline md:inline">How it works</a>
            <Link href="/sign-in" className="whitespace-nowrap hover:underline">Sign in</Link>
            <ThemeToggle className="text-[var(--lp-ink-soft)]" />
          </nav>
        </div>
      </header>

      <main>
        <section aria-labelledby="intro" className="relative isolate">
          <div className="ledger-lines pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-12 lg:py-24">
            <div>
              <p className="mb-4 text-sm font-bold text-[var(--lp-green)]">Bill collection for accountants and bookkeepers</p>
              <h1 id="intro" className={`${displayHeading} max-w-[13ch] text-[clamp(2.7rem,6vw,5.5rem)] leading-[0.99]`}>
                Client bills, straight from WhatsApp.
              </h1>
              <p className="mt-6 max-w-[45ch] text-base leading-relaxed text-[var(--lp-ink-soft)] sm:text-lg">
                Your clients forward their bills. Billraklo reads the invoice details and puts everything in one place, organised by client.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link href="/sign-up" className={startLink}>
                  Create an account <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
                <a href="#how-it-works" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold hover:underline">
                  See how it works <ArrowDownRight size={16} aria-hidden="true" />
                </a>
              </div>
            </div>
            <BillPreview />
          </div>
        </section>

        <section id="how-it-works" aria-labelledby="workflow" className="scroll-mt-6 border-y border-[var(--lp-rule)] bg-[var(--lp-paper-raised)]">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
            <h2 id="workflow" className={`${displayHeading} text-4xl sm:text-5xl`}>How it works</h2>
            <ol className="mt-9 grid gap-x-8 gap-y-7 md:grid-cols-3">
              {steps.map(({ icon: Icon, title, description }, index) => (
                <li key={title} className="border-t border-[var(--lp-rule-strong)] pt-5">
                  <div className="mb-4 flex items-center gap-3 text-sm font-bold text-[var(--lp-green)]">
                    <Icon size={21} aria-hidden="true" /> Step {index + 1}
                  </div>
                  <h3 className="font-display text-2xl font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2 max-w-[39ch] text-sm leading-relaxed text-[var(--lp-ink-soft)] sm:text-base">{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="get-started" className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-[1.65rem] bg-[var(--lp-inverse-bg)] px-6 py-9 text-[var(--lp-inverse-fg)] sm:px-10 sm:py-12">
            <div>
              <h2 id="get-started" className={`${displayHeading} text-3xl sm:text-4xl`}>Start with your first client.</h2>
              <p className="mt-2 text-sm text-[var(--lp-inverse-soft)] sm:text-base">Create your account to start collecting bills on WhatsApp.</p>
            </div>
            <Link href="/sign-up" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--lp-inverse-fg)] px-5 py-2.5 text-sm font-bold text-[var(--lp-inverse-bg)] hover:underline focus-visible:!outline-[var(--lp-inverse-fg)]">
              Create an account <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--lp-rule)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-8 lg:px-12">
          <Wordmark />
          <Link href="/sign-in" className="text-sm font-semibold hover:underline">Sign in</Link>
        </div>
      </footer>
    </div>
  );
}
