"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { Check, LockKeyhole } from "lucide-react";
import accountScreen from "@/public/steps/step1.webp";
import clientScreen from "@/public/steps/step2.webp";
import welcomeScreen from "@/public/steps/step3.webp";
import uploadScreen from "@/public/steps/step4.webp";
import unsupportedScreen from "@/public/steps/step5.webp";
import extractionScreen from "@/public/steps/step6.webp";
import billsScreen from "@/public/steps/step7.webp";
import reviewScreen from "@/public/steps/step8.webp";
import reportScreen from "@/public/steps/step9.webp";
import dashboardScreen from "@/public/steps/step10.webp";
import "./landing-guide.css";

type GuideStep = {
  title: string;
  description: string;
  device: "desktop" | "phone";
  screenshot: StaticImageData;
  alt: string;
};

const steps: GuideStep[] = [
  {
    title: "Create an account",
    description: "A CA, a CA firm, or a business owner? Your workspace starts here. Use Continue with Google for a quick, easy sign-in.",
    device: "desktop", screenshot: accountScreen,
    alt: "Billraklo sign-in page with Continue with Google and email sign-in options.",
  },
  {
    title: "Add a client",
    description: "Enter their WhatsApp number and business details. Add as many clients as you need, with every client's bills kept together.",
    device: "desktop", screenshot: clientScreen,
    alt: "Billraklo Clients page showing client details and the Add client action.",
  },
  {
    title: "Welcome message",
    description: "As soon as you add a client, they receive a welcome message on WhatsApp. They're ready to send bills, without installing another app.",
    device: "phone", screenshot: welcomeScreen,
    alt: "WhatsApp welcome message inviting a newly added client to submit bills to Billraklo.",
  },
  {
    title: "Send a PDF or image",
    description: "Your client sends a bill as a PDF or a photo in the chat. Billraklo picks it up and starts processing the document.",
    device: "phone", screenshot: uploadScreen,
    alt: "A client sending invoice attachments to Billraklo through WhatsApp.",
  },
  {
    title: "Unsupported file types",
    description: "Only PDFs and images are supported. Other file types are rejected, with a message asking your client to send a supported format.",
    device: "phone", screenshot: unsupportedScreen,
    alt: "Billraklo rejecting an unsupported attachment and requesting an image or PDF.",
  },
  {
    title: "Extract and show results",
    description: "Billraklo checks whether the document is a bill. If it is, it extracts the invoice details and sends the results back in the chat.",
    device: "phone", screenshot: extractionScreen,
    alt: "WhatsApp showing a non-bill rejection followed by extracted details from a valid invoice.",
  },
  {
    title: "Your bills list",
    description: "See the bills your clients have sent, organised in your workspace. Find the right invoice and check its processing status at a glance.",
    device: "desktop", screenshot: billsScreen,
    alt: "Billraklo Bills page listing client invoices and their processing statuses.",
  },
  {
    title: "Review with confidence",
    description: "Open an invoice, compare the extracted details with the original, and correct any mistakes. Mark it as reviewed when everything looks right.",
    device: "desktop", screenshot: reviewScreen,
    alt: "Invoice review screen with the original document and extracted fields to check and confirm.",
  },
  {
    title: "Report and export",
    description: "Turn reviewed bills into reports. Export a CSV, print or save a PDF, or download a TallyPrime-compatible XML file for your books.",
    device: "desktop", screenshot: reportScreen,
    alt: "Billraklo Reports page with purchase reports and export options.",
  },
  {
    title: "Your dashboard",
    description: "Your dashboard brings it all together: recent bills, processing updates, client counts, and the invoices that need your attention.",
    device: "desktop", screenshot: dashboardScreen,
    alt: "Billraklo Dashboard showing bills received, bills in progress, registered clients, and recent activity.",
  },
];

function DevicePreview({ step }: { step: GuideStep }) {
  return (
    <div className={`guide-device guide-device--${step.device}`}
      style={{ "--screen-ratio": step.screenshot.width / step.screenshot.height } as CSSProperties}>
      {step.device === "desktop" && (
        <div className="guide-browser-bar" aria-hidden="true">
          <span className="guide-browser-dots"><i /><i /><i /></span>
          <span><LockKeyhole size={11} /> Billraklo</span><span />
        </div>
      )}
      <div className="guide-device-screen">
        <Image src={step.screenshot} alt={step.alt}
          sizes={step.device === "phone" ? "340px" : "(max-width: 700px) 90vw, 60vw"}
          className="guide-screenshot" loading="eager" />
      </div>
    </div>
  );
}

export function LandingGuide() {
  const sectionRef = useRef<HTMLElement>(null);
  const stepsPanelRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    setActive(Math.min(steps.length - 1, Math.max(0, Math.floor(value * steps.length))));
  });

  useEffect(() => {
    // Keep the active explanation visible on short displays without moving the page.
    const panel = stepsPanelRef.current;
    if (panel) panel.scrollTop = panel.scrollHeight;
  }, [active]);

  function goToStep(index: number) {
    const section = sectionRef.current;
    if (!section) return;
    const distance = section.offsetHeight - window.innerHeight;
    const progress = (index + 0.15) / steps.length;
    window.scrollTo({
      top: section.getBoundingClientRect().top + window.scrollY + Math.max(0, distance) * progress,
      behavior: "instant",
    });
  }

  return (
    <>
      <section ref={sectionRef} className="landing-guide" id="how-it-works" aria-labelledby="guide-heading">
        <div className="guide-sticky">
          <header className="guide-heading">
            <h2 id="guide-heading">A little setup. A lot less paperwork.</h2>
            <p>Follow a bill from the first hello to your books.</p>
          </header>
          <div className="guide-stage">
            <div ref={stepsPanelRef} className="guide-steps-panel">
              <ol className="guide-steps" aria-label="How to use Billraklo">
                {steps.map((step, index) => (
                  <li key={step.title}
                    className={`guide-step ${index === active ? "is-active" : "is-complete"}`}
                    hidden={index > active}>
                    <button type="button" className="guide-step-button" onClick={() => goToStep(index)}
                      aria-current={index === active ? "step" : undefined}>
                      <span className="guide-step-number">{String(index + 1).padStart(2, "0")}</span>
                      <span className="guide-step-title">{step.title}</span>
                      {index < active && <Check className="guide-step-check" size={15} aria-hidden="true" />}
                    </button>
                    {index === active && (
                      <motion.div className="guide-step-detail"
                        initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ duration: reduceMotion ? 0 : 0.25 }}>
                        <p>{step.description}</p>
                      </motion.div>
                    )}
                  </li>
                ))}
              </ol>
            </div>
            <div className="guide-visual" aria-live="polite" aria-atomic="true">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div className="guide-device-stage" key={active}
                  initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.18 }}>
                  <DevicePreview step={steps[active]} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>
      <div id="guide-end" className="guide-end">
        <p>Your next bill can start here.</p>
        <Link href="/sign-up">Create your workspace</Link>
      </div>
    </>
  );
}
