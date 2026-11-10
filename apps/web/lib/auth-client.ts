import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

// The auth API is served by this same Next.js app, so no baseURL is needed.
export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
});
