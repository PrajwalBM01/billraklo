import { GoogleGenAI } from "@google/genai";
import { env } from "../env";

const ai = new GoogleGenAI({
  apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
  httpOptions: { apiVersion: "v1beta" },
});

type inputType = "document" | "image";
export async function isValidBill(
  type: inputType,
  data: Buffer,
  mime_type: string,
) {
  try {
    const bufferToString = data.toString("base64");

    const result = await ai.decisions.create({
      model: "gemini-decision-1",
      input: [
        {
          type,
          data: bufferToString,
          mime_type,
        },
      ],
      questions: {
        is_invoice: {
          type: "noul",
          instructions:
            "Is this document an invoice, receipt, or billing statement?",
        },
      },
    });

    const answer = result.answers?.is_invoice;

    if (!answer || answer.type !== "noul") {
      return false;
    }

    return answer.noul > 0.8;
  } catch (err) {
    console.error("Error validating input file:", err);
    return false;
  }
}
