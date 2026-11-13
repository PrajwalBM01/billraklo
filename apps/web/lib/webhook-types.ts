import z from "zod";

function lenientArray<S extends z.ZodType>(schema: S, label: string) {
  return z.array(z.unknown()).transform((items): z.output<S>[] =>
    items.flatMap((item) => {
      const result = schema.safeParse(item);
      if (result.success) return [result.data];
      console.warn(`[whatsapp] skipped unparseable ${label}`, {
        item,
        issues: result.error.issues,
      });
      return [];
    }),
  );
}

//shared types of error and contact
export const WhatsAppErrorSchema = z.object({
  code: z.number(),
  title: z.string(),
  message: z.string().optional(),
  error_data: z.object({ details: z.string() }).optional(),
  href: z.string().optional(),
});

export const WhatsAppContactSchema = z.object({
  // Meta only guarantees `wa_id`; `profile` (and even `profile.name`) is
  // omitted when the customer has no set/restricted profile name.
  //   profile: z
  //     .object({
  //       name: z.string().optional(),
  //       phone_number: z.string().optional(),
  //     })
  //     .optional(),
  wa_id: z.string(),
});

//message types
const BaseMessageSchema = z.object({
  from: z.string(),
  id: z.string(),
  timestamp: z.string(),
});

const MediaInfoSchema = z.object({
  id: z.string(),
  mime_type: z.string(),
  sha256: z.string(),
  caption: z.string().optional(),
});

export const TextMessageSchema = BaseMessageSchema.extend({
  type: z.literal("text"),
  text: z.object({ body: z.string() }),
});

export const ImageMessageSchema = BaseMessageSchema.extend({
  type: z.literal("image"),
  image: MediaInfoSchema,
});

export const DocumentMessageSchema = BaseMessageSchema.extend({
  type: z.literal("document"),
  document: MediaInfoSchema.extend({
    filename: z.string().optional(),
  }),
});

export const IncomingMessageSchema = z.discriminatedUnion("type", [
  TextMessageSchema,
  ImageMessageSchema,
  DocumentMessageSchema,
]);

//status messages
export const MessageStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["sent", "delivered", "read", "failed"]),
  timestamp: z.string(),
  recipient_id: z.string(),
  errors: z.array(WhatsAppErrorSchema).optional(),
});

//changes
export const MessagesChangeSchema = z.object({
  field: z.literal("messages"),
  value: z.object({
    messaging_product: z.literal("whatsapp"),
    metadata: z.object({
      display_phone_number: z.string(),
      phone_number_id: z.string(),
    }),
    contacts: z.array(WhatsAppContactSchema).optional(),
    messages: lenientArray(IncomingMessageSchema, "message").optional(),
    statuses: z.array(MessageStatusSchema).optional(),
    errors: z.array(WhatsAppErrorSchema).optional(),
  }),
});

//TOP-LEVEL ENVELOPE
export const WebhookPayloadSchema = z.object({
  object: z.literal("whatsapp_business_account"),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(MessagesChangeSchema),
    }),
  ),
});

export type WhatsAppWebhookPayload = z.infer<typeof WebhookPayloadSchema>;
export type WhatsAppIncomingMessage = z.infer<typeof IncomingMessageSchema>;
