export const CUSTOMER_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isCustomerServiceWindowOpen(lastInboundAt: Date | null, now = Date.now()) {
  if (!lastInboundAt) return false;
  const age = now - lastInboundAt.getTime();
  return age >= 0 && age < CUSTOMER_SERVICE_WINDOW_MS;
}

/** Uses the actual international phone number, never Meta's phone-number ID. */
export function buildWhatsAppInvitation(botNumber: string) {
  const digits = botNumber.replace(/[\s()+-]/g, "");
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent("Hi, start Billraklo")}`;
}
