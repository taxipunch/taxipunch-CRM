import { GoogleGenAI } from "@google/genai";

// Lazy-init: only construct when actually called (avoids crashing at import time in browser)
let _ai: InstanceType<typeof GoogleGenAI> | null = null;
function getAI() {
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });
  }
  return _ai;
}

export async function generateMorningBrief(activityData: any) {
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
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
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
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

export async function extractTranscriptFields(rawText: string) {
  const nullFields = { name: null, business_name: null, niche: null, phone: null, email: null, address: null, notes: null, entity_type: null };
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are extracting structured data from a phone call transcript for a home services CRM in Williamsport PA. Return only valid JSON with no markdown, no backticks, no preamble.

Extract these fields from the transcript: name, business_name, niche, phone, email, address, notes, entity_type (must be 'provider' or 'buyer'). Return null for any field not found.

Transcript: ${rawText}`,
      config: {
        responseMimeType: "application/json"
      }
    });
    const responseText = response.text || '{}';
    console.log('Extraction raw response:', responseText);
    const raw = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    const parsed = JSON.parse(raw);
    console.log('Extraction parsed:', parsed);
    return { ...nullFields, ...parsed };
  } catch (error: any) {
    console.error("Error extracting transcript fields:", error);
    throw new Error(error?.message || 'Extraction failed. Check your API key.');
  }
}

export async function generateOneSheets(provider: any, buyer: any) {
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
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

export async function generateOneSheet(provider: any, buyer: any, niche: string) {
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are writing a professional introduction brief for a local service marketplace in Williamsport PA. Be specific, warm, and concise. No corporate fluff.

Write a one-page introduction brief connecting ${provider.business_name || provider.name} (${niche}) with ${buyer.org_name} (${buyer.units || 'unknown'} units, ${buyer.property_type || 'commercial'}). Include: a one paragraph intro for each party, why this match makes sense, and a suggested next step.

Write in plain text, no markdown. Use line breaks between sections. Keep the tone professional but human.`,
    });
    return response.text || 'Unable to generate brief.';
  } catch (error) {
    console.error("Error generating one-sheet:", error);
    return "Unable to generate brief. Please try again.";
  }
}
