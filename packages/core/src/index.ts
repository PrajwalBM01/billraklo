import { prisma } from "./db";
import { sendText } from "./whatsapp";

export { prisma, sendText };
export {
  sendTemplate,
  describeWhatsAppError,
  type WhatsAppSendResult,
  downloadMedia,
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

export { getBillQueue, BILLS_QUEUE, type BillJob, redis } from "./queue";
export {uploadToSupabase} from "./storage"