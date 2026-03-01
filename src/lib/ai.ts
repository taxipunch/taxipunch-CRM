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

type OneSheetTemplate = 'provider_profile' | 'overflow_pitch' | 'intro_provider' | 'intro_buyer';

interface OneSheetContext {
  template: OneSheetTemplate;
  provider: any;
  buyer?: any;
  territory?: string;
  openBuyerCount?: number;
}

function buildOneSheetPrompt(ctx: OneSheetContext): string {
  const { template, provider, buyer, territory, openBuyerCount } = ctx;

  switch (template) {
    case 'provider_profile':
      return `write a short one-sheet for a buyer introducing this service provider.
provider: ${provider.business_name || provider.name}
niche: ${provider.niche}
territory: ${territory}
review score: ${provider.review_score} stars from ${provider.review_count} reviews
website: ${provider.website_built_url}
notes: ${provider.notes}
format:

one line intro ("hey, thought this might be useful...")
who they are (1-2 sentences, casual)
why they're worth trusting (reviews, reliability, local)
what they cover
closing line with soft CTA ("let me know if you want an intro")

lowercase throughout. no bullet points in output. short paragraphs.`;

    case 'overflow_pitch':
      return `write a short one-sheet pitching a bench provider on taking overflow work.
provider: ${provider.business_name || provider.name}
niche: ${provider.niche}
territory: ${territory}
open buyer demand: ${openBuyerCount} buyers currently needing ${provider.niche} work in this area
format:

one line hook ("hey, i've got more work coming in than i can place right now...")
what the opportunity is (1-2 sentences)
what you're offering (discounted monthly rate, overflow leads, no exclusivity pressure)
soft CTA ("interested? let's talk")

lowercase throughout. no bullet points in output. conversational.`;

    case 'intro_provider':
      return `write a short one-sheet for a service provider introducing a potential client.
provider: ${provider.business_name || provider.name}
niche: ${provider.niche}
buyer org: ${buyer.org_name}
buyer property type: ${buyer.property_type}
buyer units: ${buyer.units}
buyer notes: ${buyer.notes}
territory: ${territory}
format:

one line opener ("hey, found someone who might need exactly what you do...")
who the buyer is (1-2 sentences, what they manage, what they need)
why it's a good fit for the provider
soft CTA ("want me to make the connection?")

lowercase throughout. no bullet points in output. short and warm.`;

    case 'intro_buyer':
      return `write a short one-sheet for a property manager introducing a vetted service provider.
buyer: ${buyer.org_name}
provider: ${provider.business_name || provider.name}
niche: ${provider.niche}
territory: ${territory}
review score: ${provider.review_score} stars from ${provider.review_count} reviews
website: ${provider.website_built_url}
provider notes: ${provider.notes}
format:

one line opener ("hey, i know a guy...")
who the provider is (1-2 sentences, what they do, how long, where)
why they're trustworthy (reviews, local, vetted)
soft CTA ("want me to set up a call?")

lowercase throughout. no bullet points in output. warm and confident.`;
  }
}

export async function generateOneSheet(context: OneSheetContext): Promise<string> {
  const { template, provider, buyer } = context;

  // Validate required fields per template
  if (!provider) throw new Error('generateOneSheet: provider is required for all templates');
  if ((template === 'intro_provider' || template === 'intro_buyer') && !buyer) {
    throw new Error(`generateOneSheet: buyer is required for template "${template}"`);
  }
  if (template === 'overflow_pitch' && context.openBuyerCount == null) {
    throw new Error('generateOneSheet: openBuyerCount is required for overflow_pitch template');
  }

  const userPrompt = buildOneSheetPrompt(context);
  const systemPrompt = 'you write short, casual, lowercase outreach documents for a local service marketplace. no formal language. no capitalized sentences. warm and direct, like a text from someone who knows people. get to the point fast.';

  try {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
    if (!apiKey) throw new Error('Missing VITE_ANTHROPIC_API_KEY environment variable');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    const raw: string = data.content?.[0]?.text || '';

    // Strip markdown backticks if present
    return raw.replace(/```[\s\S]*?```/g, '').replace(/`/g, '').trim();
  } catch (error) {
    console.error('Error generating one-sheet:', error);
    throw error;
  }
}
