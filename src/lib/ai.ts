import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateMorningBrief(activityData: any) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `You are a business co-pilot for Joseph, who runs a local service provider network in Williamsport, PA. 
      
      Yesterday's activity: ${JSON.stringify(activityData)}
      
      Write a 2-3 sentence morning brief in the second person. Mention the most significant thing that happened yesterday, the current state of the most important active relationship, and what the highest-leverage move is today. Be specific — use real names and numbers from the data. Write in a calm, direct tone. No bullet points. No headers. Just prose.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating morning brief:", error);
    return "Good morning, Joseph. Ready to build the network today?";
  }
}

export async function extractTranscript(rawText: string, callType: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `You are extracting structured CRM data from a ${callType} call transcript for Joseph, who runs a local service provider network.
      
      Transcript: ${rawText}
      
      Return ONLY valid JSON with no preamble. Extract:
      {
        "entity_type": "buyer" | "provider" | "unclassified",
        "contact_name": string | null,
        "org_name": string | null,
        "territory": string | null,
        "niches": string[] | null,
        "units": number | null,
        "urgency": "low" | "medium" | "high" | null,
        "stage_signal": string | null,
        "next_step": string | null,
        "buying_signals": string[],
        "red_flags": string[],
        "summary": string,
        "prospects": [{ "name": string, "niche": string, "signal": "positive"|"neutral"|"negative" }] | null
      }
      
      If a field was not discussed, return null. Flag urgency signals and red flags explicitly.`,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error extracting transcript:", error);
    return null;
  }
}

export async function generateOneSheets(provider: any, buyer: any) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: `Generate introduction documents for a match.
      
      Provider: ${JSON.stringify(provider)}
      Buyer: ${JSON.stringify(buyer)}
      
      Return a JSON object with two fields: "buyerOneSheet" and "providerBrief".
      
      "buyerOneSheet": Write a brief provider recommendation for ${buyer.contact_name} at ${buyer.org_name}. Keep it professional, warm, and specific. 2-3 sentences max.
      
      "providerBrief": Write a brief opportunity description for ${provider.name} about a potential client. Lead with estimated monthly value ($${(buyer.units || 0) * 20}–$${(buyer.units || 0) * 30}/mo). Be specific about unit count and urgency. 2-3 sentences.`,
      config: {
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error generating one-sheets:", error);
    return { buyerOneSheet: "Error generating brief.", providerBrief: "Error generating brief." };
  }
}
