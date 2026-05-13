/**
 * Translation Engine (Frontend)
 * Sarvam.ai for Indian languages → OpenRouter for everything else
 */
import { store, KEYS } from "./storage";
import { LANGS } from "./constants";

let _openrouterKey = "";
let _sarvamKey = "";

export function setKeys(openrouterKey: string, sarvamKey: string) {
  _openrouterKey = openrouterKey;
  _sarvamKey = sarvamKey;
}

let _cache: Record<string, string> = {};

export async function loadCache() {
  const saved = await store.get<Record<string, string>>(KEYS.TRANSLATION_CACHE);
  if (saved) _cache = saved;
}

async function saveCache() {
  const keys = Object.keys(_cache);
  if (keys.length > 800) {
    const trimmed: Record<string, string> = {};
    keys.slice(-600).forEach(k => { trimmed[k] = _cache[k]; });
    _cache = trimmed;
  }
  await store.set(KEYS.TRANSLATION_CACHE, _cache);
}

function sarvamCode(langName: string): string | null {
  return LANGS.find(l => l.name === langName)?.sarvam ?? null;
}

function isIndian(langName: string): boolean {
  return LANGS.find(l => l.name === langName)?.indian ?? false;
}

async function sarvamTranslate(text: string, from: string, to: string): Promise<string> {
  const sourceCode = sarvamCode(from);
  const targetCode = sarvamCode(to);
  if (!sourceCode || !targetCode) throw new Error("Unsupported language for Sarvam");
  const res = await fetch("https://api.sarvam.ai/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-subscription-key": _sarvamKey },
    body: JSON.stringify({ input: text, source_language_code: sourceCode, target_language_code: targetCode, mode: "formal", model: "mayura:v1", enable_preprocessing: true }),
  });
  if (!res.ok) throw new Error(`Sarvam API error: ${res.status}`);
  const data = await res.json();
  return data.translated_text || text;
}

async function openrouterTranslate(text: string, from: string, to: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${_openrouterKey}`, "HTTP-Referer": "https://live-interpreter.app", "X-Title": "Live Interpreter" },
    body: JSON.stringify({ model: "anthropic/claude-3-haiku", max_tokens: 512, messages: [{ role: "user", content: `Translate from ${from} to ${to}. Return ONLY the translated text:\n"${text}"` }] }),
  });
  if (!res.ok) throw new Error(`OpenRouter API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || text;
}

export async function translateText(text: string, from: string, to: string): Promise<string> {
  if (!text.trim()) return "";
  if (from === to) return text;
  const cacheKey = `${from}|${to}|${text.toLowerCase().trim()}`;
  if (_cache[cacheKey]) return _cache[cacheKey];
  const usesSarvam = _sarvamKey && (isIndian(from) || isIndian(to));
  let result = text;
  if (usesSarvam) {
    try {
      if (sarvamCode(from) && sarvamCode(to)) {
        result = await sarvamTranslate(text, from, to);
      } else if (!_openrouterKey) {
        throw new Error("OpenRouter key required for non-Indian target");
      } else {
        if (isIndian(from) && !isIndian(to)) {
          const english = await sarvamTranslate(text, from, "English");
          result = await openrouterTranslate(english, "English", to);
        } else if (!isIndian(from) && isIndian(to)) {
          const english = await openrouterTranslate(text, from, "English");
          result = await sarvamTranslate(english, "English", to);
        }
      }
    } catch (err) {
      if (_openrouterKey) result = await openrouterTranslate(text, from, to);
      else result = `[Translation failed] ${text}`;
    }
  } else if (_openrouterKey) {
    try { result = await openrouterTranslate(text, from, to); }
    catch { result = `[Translation error] ${text}`; }
  } else {
    result = "⚠️ No API keys configured.";
  }
  _cache[cacheKey] = result;
  saveCache();
  return result;
}

export function engineStatus() {
  if (_sarvamKey && _openrouterKey) return { label: "Sarvam + OpenRouter", color: "#4ade80", dual: true };
  if (_sarvamKey) return { label: "Sarvam.ai only", color: "#fb923c", dual: false };
  if (_openrouterKey) return { label: "OpenRouter only", color: "#60a5fa", dual: false };
  return { label: "No API keys set", color: "#ef4444", dual: false };
}
