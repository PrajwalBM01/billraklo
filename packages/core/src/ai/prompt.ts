export const EXTRACT_PROMPT = {
  version: "v2",
  text: `You are reading an Indian GST tax invoice on behalf of the buyer.

    Input formate: Image or PDF, PDF can contain single or multiple invoices.
  
  Rules:
  - Copy the invoice number EXACTLY as printed, including slashes, dashes and letters.
  - Write dates as YYYY-MM-DD. Indian bills usually use day-month-year order.
  - Return null for any field you cannot read clearly. Never guess a number.
  - Set isTaxInvoice to false for quotations, estimates, delivery challans, payment screenshots.
  - Set confidence to "low" if the image is blurry, cut off, or handwritten.
  - Amounts are in rupees; report them as numbers without currency symbols or commas.
  - If there are multiple invoices in a PDF then make them into an array of invoice as per the output object structure`,
};
