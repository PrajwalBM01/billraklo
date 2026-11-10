type AuthError = { code?: string; message?: string; status?: number } | null | undefined;

// Error codes returned by the Better Auth API (core + email OTP plugin).
const apiMessages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Incorrect email or password.",
  EMAIL_NOT_VERIFIED: "Verify your email to continue.",
  USER_ALREADY_EXISTS: "An account with this email already exists. Try signing in.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "An account with this email already exists. Try signing in.",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters.",
  PASSWORD_TOO_LONG: "Password is too long.",
  INVALID_PASSWORD: "Your current password is incorrect.",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "This account doesn't have a password yet.",
  INVALID_OTP: "That code is incorrect.",
  OTP_EXPIRED: "That code has expired. Request a new one.",
  TOO_MANY_ATTEMPTS: "Too many wrong attempts. Request a new code.",
  FAILED_TO_UNLINK_LAST_ACCOUNT: "You can't remove your only way to sign in.",
  SESSION_EXPIRED: "Your session has expired. Sign in again.",
  SESSION_NOT_FRESH: "For security, sign out and sign in again before changing this.",
  ACCOUNT_NOT_FOUND: "That sign-in method isn't linked to your account.",
};

export function authErrorMessage(error: AuthError, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  if (error.status === 429) return "Too many requests. Wait a minute and try again.";
  return (error.code && apiMessages[error.code]) || error.message || fallback;
}

// Error codes Better Auth puts in ?error= when an OAuth redirect fails.
const oauthMessages: Record<string, { title: string; description: string }> = {
  account_not_linked: {
    title: "Verify your email first",
    description:
      "An account with this email already exists but its email isn't verified yet. Sign in with your email and password, enter the code we send you, then continue with Google again.",
  },
  unable_to_link_account: {
    title: "Couldn't link your Google account",
    description:
      "Google didn't confirm this email, or your account's email isn't verified yet. Verify your email and try again.",
  },
  email_does_not_match: {
    title: "Different email address",
    description:
      "That Google account uses a different email than your Billraklo account. Choose the Google account with the same email.",
  },
  account_already_linked_to_different_user: {
    title: "Google account already in use",
    description: "That Google account is already linked to a different Billraklo user.",
  },
  email_not_verified: {
    title: "Email not verified",
    description: "Google didn't confirm this email address, so we can't sign you in with it.",
  },
  state_mismatch: {
    title: "Sign-in expired",
    description: "The sign-in took too long or was started in another tab. Please try again.",
  },
};

export function oauthErrorMessage(code: string | undefined) {
  return (
    (code ? oauthMessages[code] : undefined) ?? {
      title: "Sign-in failed",
      description: "Something went wrong while signing you in. Please try again.",
    }
  );
}

// Only allow same-site relative redirects, so ?next= can't send users off-site.
export function safeRedirect(target: string | null | undefined, fallback = "/dashboard") {
  if (!target || !target.startsWith("/") || target.startsWith("//") || target.startsWith("/\\")) {
    return fallback;
  }
  return target;
}
