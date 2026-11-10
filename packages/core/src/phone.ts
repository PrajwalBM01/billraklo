// Client numbers are stored the way WhatsApp reports them (`wa_id`): the 91 country
// code followed by the 10-digit Indian mobile number, digits only, e.g. 919876543210.

const INDIAN_MOBILE = /^[6-9]\d{9}$/;

/**
 * Turns user input into the stored form, or null if it isn't an Indian mobile number.
 * Accepts "9876543210", "98765 43210", "+91 98765-43210", "09876543210", "919876543210".
 */
export function normalizeIndianMobile(input: string): string | null {
  let digits = input.replace(/\D/g, "");

  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);

  return INDIAN_MOBILE.test(digits) ? `91${digits}` : null;
}

/** "919876543210" -> "+91 98765 43210" */
export function formatIndianMobile(stored: string): string {
  const local = stored.startsWith("91") ? stored.slice(2) : stored;
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
}
