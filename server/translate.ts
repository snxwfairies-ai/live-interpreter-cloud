import { ApiKeys } from "./db.js";

const SARVAM_CODES: Record<string, string> = {
  hi: "hi-IN", te: "te-IN", ta: "ta-IN", mr: "mr-IN",
  kn: "kn-IN", ml: "ml-IN", gu: "gu-IN", bn: "bn-IN",
  pa: "pa-IN", en: "en-IN",
};
const SARVAM_SUPPORTED = new Set(Object.keys(SARVAM_CODES));

function shouldUseSarvam(fromCode: string, toCode: string): boolean {
  const sarvamKey = ApiKeys.get("sarvam");
  return !!(sarvamKey && SARVAM_SUPPORTED.has(fromCode) && SARVAM_SUPPORTED.has(toCode));
}

async function translateWithSarvam(
  text: string, fromCode: string, toCode: string
): Promise<{ result: string; engine: "sarvam" }> {
  const key = ApiKeys.get("sarvam");
  if (!key) throw new Error("Sarvam API key not set");
  const res = await fetch("https://api.sarvam.ai/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-subscription-key": key },
    body: JSON.stringify({
      input: text, source_language_code: SARVAM_CODES[fromCode] || "en-IN",
      target_language_code: SARVAM_CODES[toCode] || "hi-IN",
      speaker_gender: "Female", mode: "formal", model: "mayura:v1", enable_preprocessing: true,
    }),
  });
  if (!res.ok) throw new Error(`Sarvam error ${res.status}`);
  const data = await res.json() as any;
  return { result: data.translated_text?.trim() || text, engine: "sarvam" };
}

async function translateWithOpenRouter(
  text: string, fromName: string, toName: string
): Promise<{ result: string; engine: "openrouter" }> {
  const key = ApiKeys.get("openrouter");
  if (!key) throw new Error("OpenRouter API key not set");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
      "HTTP-Referer": "https://live-interpreter.app",
      "X-Title": "Live Interpreter",
    },
    body: JSON.stringify({
      model: "anthropic/claude-3-haiku",
      max_tokens: 512,
      messages: [{ role: "user", content: `Translate from ${fromName} to ${toName}. Return ONLY the translated text, nothing else:\n"${text}"` }],
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  const d = await res.json();
  return { result: d.choices?.[0]?.message?.content?.trim() || text, engine: "openrouter" };
}

export async function sarvamSTT(audioBuffer: Buffer, langCode: string): Promise<string> {
  const key = ApiKeys.get("sarvam");
  if (!key) throw new Error("Sarvam API key not set");
  const formData = new FormData();
  formData.append("file", new Blob([audioBuffer], { type: "audio/wav" }), "audio.wav");
  formData.append("model", "saaras:v2");
  formData.append("language_code", SARVAM_CODES[langCode] || "hi-IN");
  const res = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST", headers: { "api-subscription-key": key }, body: formData,
  });
  if (!res.ok) throw new Error(`Sarvam STT error: ${res.status}`);
  const data = await res.json() as any;
  return data.transcript || "";
}

export async function translate(
  text: string, fromCode: string, toCode: string, fromName: string, toName: string
): Promise<{ result: string; engine: "sarvam" | "openrouter" }> {
  if (!text.trim()) return { result: "", engine: "openrouter" };
  if (shouldUseSarvam(fromCode, toCode)) {
    try { return await translateWithSarvam(text, fromCode, toCode); }
    catch (e: any) { console.warn("Sarvam failed, falling back to OpenRouter:", e.message); }
  }
  return await translateWithOpenRouter(text, fromName, toName);
}

export async function validateSarvamKey(key: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.sarvam.ai/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-subscription-key": key },
      body: JSON.stringify({ input: "Hello", source_language_code: "en-IN", target_language_code: "hi-IN", model: "mayura:v1" }),
    });
    return res.status !== 401 && res.status !== 403;
  } catch { return false; }
}

export async function validateOpenRouterKey(key: string): Promise<boolean> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}`, "HTTP-Referer": "https://live-interpreter.app", "X-Title": "Live Interpreter" },
      body: JSON.stringify({ model: "anthropic/claude-3-haiku", max_tokens: 10, messages: [{ role: "user", content: "hi" }] }),
    });
    return res.status !== 401 && res.status !== 403;
  } catch { return false; }
}
