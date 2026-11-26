import Image from "next/image";
import Link from "next/link";
import { Bricolage_Grotesque, Public_Sans } from "next/font/google";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight, ClipboardCheck, FileScan, Menu, MessageCircle } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LandingDemo } from "@/components/landing-demo";
import { LandingGuide } from "@/components/landing-guide";
import landingImage from "../public/landing.webp";
import "./landing.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const body = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap" });

const features = [
  { icon: MessageCircle, title: "Collect bills on WhatsApp", description: "Clients forward photos or PDFs from the app they already use." },
  { icon: FileScan, title: "Extract invoice details", description: "Billraklo reads supplier names, invoice numbers, dates and totals." },
  { icon: ClipboardCheck, title: "Review bills by client", description: "Check the extracted details against the original bill and confirm them in one place." },
];

function AccountLinks() {
  return <><ThemeToggle className="dd-theme-toggle" /><Link href="/sign-in" className="dd-login">Log In</Link><Link href="/sign-up" className="dd-start">Get Started</Link></>;
}

export default function Home() {
  return (
    <div id="top" className={`dd-landing ${display.variable} ${body.variable}`}>
      <div className="dd-hero">
      <header className="dd-header">
        <Link href="/" className="dd-brand" aria-label="Billraklo home">
          <span className="dd-mark" aria-hidden="true"><BrandLogo /></span>
          Billraklo
        </Link>
        <nav className="dd-account" aria-label="Account"><AccountLinks /></nav>
        <details className="dd-mobile-menu">
          <summary aria-label="Account menu"><Menu size={24} aria-hidden="true" /></summary>
          <nav aria-label="Mobile account"><AccountLinks /></nav>
        </details>
      </header>

      <main className="dd-main">
        <section className="dd-intro" aria-labelledby="landing-heading">
          <h1 id="landing-heading">Take client invoices from WhatsApp to your books.</h1>
          <p className="dd-description">Billraklo collects and extracts invoice details for chartered accountants. Review bills by client and keep the paperwork digital.</p>
          <div className="dd-actions">
            <Link href="/sign-up" className="dd-primary">Get Started Free<ArrowRight size={18} aria-hidden="true" /></Link>
            <LandingDemo />
          </div>
        </section>

        <section className="dd-features" aria-label="Document intelligence features">
          {features.map(({ icon: Icon, title, description }) => (
            <article className="dd-feature" key={title}>
              <span className="dd-feature-icon"><Icon size={28} strokeWidth={1.8} aria-hidden="true" /></span>
              <div><h2>{title}</h2><p>{description}</p></div>
            </article>
          ))}
        </section>

        <div className="dd-artwork">
          <Image src={landingImage} alt="Paper documents on the left become a digital dashboard on a laptop on the right." sizes="(max-width: 991px) 100vw, (max-width: 1222px) 72vw, 880px" preload className="dd-image" />
        </div>
      </main>
      </div>
      <LandingGuide />
      <footer className="dd-footer">
        <div className="dd-footer-main">
          <div className="dd-footer-about">
            <Link href="#top" className="dd-brand" aria-label="Billraklo home">
              <span className="dd-mark" aria-hidden="true"><BrandLogo /></span>
              Billraklo
            </Link>
            <p>Less chasing bills.<br />More time for your business.</p>
            <span>Collect on WhatsApp. Review in one place.</span>
          </div>
          <nav className="dd-footer-links" aria-labelledby="footer-explore">
            <h2 id="footer-explore">Explore</h2>
            <Link href="#top">Overview</Link>
            <Link href="#how-it-works">How it works</Link>
            <a href="https://github.com/PrajwalBM01/billraklo" target="_blank" rel="noopener noreferrer">GitHub</a>
          </nav>
          <nav className="dd-footer-links" aria-labelledby="footer-account">
            <h2 id="footer-account">Your workspace</h2>
            <Link href="/sign-up">Create an account</Link>
            <Link href="/sign-in">Sign in</Link>
          </nav>
        </div>
        <div className="dd-footer-bottom">
          <p>&copy; 2026 Billraklo. All rights reserved.</p>
          <p>Built by <a href="https://x.com/xshadowdev" target="_blank" rel="noopener noreferrer">xshadowdev</a></p>
          <Link href="/privacy-policy">Privacy policy</Link>
        </div>
      </footer>
    </div>
  );
}
