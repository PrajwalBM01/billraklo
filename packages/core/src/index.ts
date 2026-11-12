import { prisma } from "./db";
import { sendText } from "./whatsapp";

export { prisma, sendText };
export {
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

export { getBillQueue } from "./queue";
