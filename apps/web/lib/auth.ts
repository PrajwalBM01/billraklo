import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { prisma } from "@billraklo/core";
import { sendOtpEmail } from "@/lib/email";

export const auth = betterAuth({
  appName: "Billraklo",
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    // Unverified users can't sign in. This also matters for linking: Google is only
    // linked onto an existing user once that user's email has been verified.
    requireEmailVerification: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
  },

  // The emailOTP plugin below supplies sendVerificationEmail, so verification
  // uses a 6-digit code instead of a link.
  emailVerification: {
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      prompt: "select_account",
    },
  },

  account: {
    accountLinking: {
      // Google reports verified emails, so signing in with Google using the same
      // email as a verified email+password user links both to one user.
      enabled: true,
    },
  },

  onAPIError: {
    errorURL: "/auth/error",
  },

  plugins: [
    emailOTP({
      overrideDefaultEmailVerification: true,
      otpLength: 6,
      expiresIn: 60 * 10,
      allowedAttempts: 5,
      async sendVerificationOTP({ email, otp, type }) {
        // Not awaited so response timing doesn't reveal whether the email exists.
        void sendOtpEmail({ to: email, otp, type });
      },
    }),
    // Must stay last so cookies set by server actions reach the browser.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
