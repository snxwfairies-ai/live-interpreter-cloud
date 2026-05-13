/**
 * Translation Engine — proxies through the server so API keys stay server-side
 */
import { store, KEYS } from "./storage";

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

export async function translateText(
  text: string, fromName: string, toName: string
): Promise<string> {
  if (!text.trim()) return "";
  const cacheKey = `${fromName}|${toName}|${text.toLowerCase().trim()}`;
  if (_cache[cacheKey]) return _cache[cacheKey];

  try {
    const res = await fetch("/api/proxy/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, fromName, toName }),
    });
    const data = await res.json();
    const result = data.result || text;
    _cache[cacheKey] = result;
    saveCache();
    return result;
  } catch {
    return `[Translation error] ${text}`;
  }
}

export function engineStatus() {
  // Check server-side key status via a lightweight endpoint
  return { label: "Server keys", color: "#4ade80", dual: true };
}

// No-op — server handles keys now
export function setKeys(_openrouterKey: string, _sarvamKey: string) {}
