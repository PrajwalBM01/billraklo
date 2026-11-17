import { GoogleGenAI } from "@google/genai";
import { env } from "../env";

const ai = new GoogleGenAI({
  apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
  httpOptions: { apiVersion: "v1beta" },
});

type inputType = "document" | "image";
export async function isValidBill(type: inputType, data: Buffer, mime_type: string) {
    const bufferToString = data.toString("base64")
  try {
    const result = await ai.decisions.create({
      model: "gemini-decision-1",
      input: [
        {
          type: type,
          data: bufferToString,
          mime_type: mime_type,
        },
      ],
      questions: {
        is_invoice: {
          type: "noul", // Strict Yes/No question type
          instructions:
            "Is this document an invoice, receipt, or billing statement?",
        },
      },
    });
    console.log(result.answers);
    const answer = result.answers?.is_invoice;

    if (answer && answer.type === "noul") {
      console.log(`Probability (Yes): ${(answer.noul * 100).toFixed(1)}%`);
      console.log(`Confidence: ${(answer.confidence * 100).toFixed(1)}%`);

      // Simple conditional branching
      if (answer.noul > 0.8) {
        console.log("Route to invoice processing pipeline.");
      } else {
        console.log("Document is not an invoice.");
      }
    }
  } catch (err) {
    console.error("something went wrong while validating input file",err);
  }
}
