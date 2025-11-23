import { GoogleGenAI, Type, Schema } from "@google/genai";
import { KnowledgeGap, UserContext, InterviewAnswer } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
    throw new Error("API_KEY not found in environment. Please set GEMINI_API_KEY in .env.local");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to convert Blob to Base64 (strip data URI prefix)
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const transcribeVideo = async (videoBlob: Blob): Promise<string> => {
  const ai = getClient();
  const base64Data = await blobToBase64(videoBlob);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "video/mp4", // Defaulting to generic mp4/webm container handling
              data: base64Data,
            },
          },
          { text: "Transcribe the speech in this video interview answer verbatim. If there is no speech, say '[No speech detected]'." }
        ]
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Transcription error:", error);
    return "[Error generating transcript]";
  }
};

export const generateGaps = async (context: UserContext): Promise<KnowledgeGap[]> => {
  // This function is no longer used - the app now uses Watsonx Orchestrate
  // Keeping this file only for video transcription functionality
  throw new Error("Knowledge gap generation is handled by Watsonx Orchestrate. Please use the watsonx service instead.");
};

export const generateFinalHandover = async (context: UserContext, gaps: KnowledgeGap[], answers: Record<string, InterviewAnswer>): Promise<string> => {
  const ai = getClient();

  // Format data for the model
  const interviewData = gaps.map(gap => {
    const ans = answers[gap.id]?.content || "No answer provided.";
    return `Topic: ${gap.title}\nQuestion: ${gap.primaryQuestion}\nTranscript of Video Answer: ${ans}\n---\n`;
  }).join("\n");

  const prompt = `
    Create a professional Knowledge Handover Document based on the following video interview transcripts.
    
    Employee: ${context.name} (${context.role})
    
    Transcript:
    ${interviewData}
    
    IMPORTANT: Output plain text only. Do NOT use any markdown formatting like asterisks (*), bold (**), headers (#), or any other markdown syntax.
    Use only plain text with clear section titles in ALL CAPS, and separate sections with blank lines.
    
    Structure the document as follows:
    
    EXECUTIVE SUMMARY
    [Provide a brief overview here]
    
    CRITICAL RISKS IDENTIFIED
    [List the key risks here]
    
    DETAILED KNOWLEDGE TRANSFER
    [For each topic, provide detailed information]
    
    RECOMMENDED NEXT STEPS
    [Provide actionable recommendations]
    
    Use clear, professional language. Separate paragraphs with blank lines. Use numbered lists or bullet points only as plain text (e.g., "1. First item" or "- First item").
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text || "Failed to generate summary.";
};