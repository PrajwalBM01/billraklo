import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import "./policy.css";

export const metadata: Metadata = {
  title: "Privacy Policy | Billraklo",
  description: "How Billraklo collects, uses, stores, and handles your information, and how to request deletion.",
};

export default async function PrivacyPolicyPage() {
  "use cache";
  // The policy is deployment content, so include it in the prerendered page.
  cacheLife("max");

  const policy = await readFile(path.join(process.cwd(), "public", "policy.md"), "utf8");

  return (
    <div className="policy-page">
      <header className="policy-header">
        <Link href="/" className="policy-brand" aria-label="Billraklo home">
          <span><BrandLogo /></span>Billraklo
        </Link>
        <ThemeToggle />
      </header>
      <main className="policy-main">
        <Link href="/" className="policy-back">Back to home</Link>
        <article className="policy-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{policy}</ReactMarkdown>
        </article>
      </main>
      <footer className="policy-footer">
        <span>Billraklo</span>
        <a href="/policy.md" download>Download policy</a>
      </footer>
    </div>
  );
}
