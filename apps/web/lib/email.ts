import { Resend } from "resend";

export type OtpEmailType =
  | "sign-in"
  | "email-verification"
  | "forget-password"
  | "change-email";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Resend's shared sender only delivers to the Resend account owner's inbox.
// Set EMAIL_FROM to an address on a verified domain to email anyone else.
const from = process.env.EMAIL_FROM || "Billraklo <onboarding@resend.dev>";

const copy: Record<OtpEmailType, { subject: string; intro: string }> = {
  "sign-in": {
    subject: "Your Billraklo sign-in code",
    intro: "Use this code to sign in to Billraklo.",
  },
  "email-verification": {
    subject: "Verify your Billraklo email",
    intro: "Use this code to verify your email address.",
  },
  "forget-password": {
    subject: "Reset your Billraklo password",
    intro: "Use this code to reset your password.",
  },
  "change-email": {
    subject: "Confirm your new Billraklo email",
    intro: "Use this code to confirm your new email address.",
  },
};

export async function sendOtpEmail({
  to,
  otp,
  type,
}: {
  to: string;
  otp: string;
  type: OtpEmailType;
}) {
  const { subject, intro } = copy[type];

  // In development, always print the code so the flow can be tested even when
  // Resend won't deliver (no API key, or a recipient the test sender can't reach).
  if (process.env.NODE_ENV !== "production") {
    console.info(`[email] ${type} code for ${to}: ${otp}`);
  }

  if (!resend) return;

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    text: `${intro}\n\n${otp}\n\nThe code expires in 10 minutes. If you didn't request it, you can ignore this email.`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:420px;margin:0 auto;padding:24px;color:#111">
        <p style="margin:0 0 16px">${intro}</p>
        <p style="margin:0 0 16px;font-size:32px;font-weight:600;letter-spacing:8px">${otp}</p>
        <p style="margin:0;color:#666;font-size:14px">The code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
      </div>
    `,
  });

  if (error) {
    console.error(`[email] failed to send ${type} code to ${to}:`, error);
  }
}
