import { prisma } from "./db";
import { sendText } from "./whatsapp";

export { prisma, sendText };
export {
  downloadMedia,
  MAX_MEDIA_BYTES,
  WhatsAppMediaError,
  sendTemplate,
  describeWhatsAppError,
  type WhatsAppSendResult,
} from "./whatsapp";
export { normalizeIndianMobile, formatIndianMobile } from "./phone";
export {
  parseClientInput,
  listClients,
  createClient,
  removeClient,
  sendClientWelcome,
  retryClientWelcome,
  recordWelcomeStatus,
  type ClientInput,
  type ClientField,
} from "./clients";
export {
  billAttentionFilter,
  billEntrySelect,
  billProcessingStatuses,
  billReviewStatuses,
  canReviewBill,
  extractedRupeesToPaise,
  listBills,
  parseStoredInvoices,
} from "./bills";

export {
  getBillQueue,
  BILLS_QUEUE,
  type BillJob,
  redis,
  getMaintenanceQueue,
  MAINTENANCE_QUEUE,
} from "./queue";
export { putObject, getObject, signedUrl } from "./storage";

export { isUniqueViolation, isPrismaError } from "./prisma-error";

export { InvoiceSchema, type Invoice } from "./ai/invoice-schema";
export { EXTRACT_PROMPT } from "./ai/prompt";
export { createSharedAuthOptions } from "./auth";
