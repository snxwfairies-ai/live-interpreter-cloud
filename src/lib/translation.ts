import { store, KEYS } from "./storage";

let _cache: Record<string, string> = {};
let _deviceToken: string | null = null;

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

export async function initDeviceAuth(): Promise<string | null> {
  let deviceId = await store.get<string>("device_id");
  if (!deviceId) {
    deviceId = `d-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
    await store.set("device_id", deviceId);
  }
  try {
    const res = await fetch("/api/auth/device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    _deviceToken = data.token;
    return _deviceToken;
  } catch { return null; }
}

export async function translateText(
  text: string, fromName: string, toName: string
): Promise<string> {
  if (!text.trim()) return "";
  const cacheKey = `${fromName}|${toName}|${text.toLowerCase().trim()}`;
  if (_cache[cacheKey]) return _cache[cacheKey];
  if (!_deviceToken) await initDeviceAuth();
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (_deviceToken) headers["Authorization"] = `Bearer ${_deviceToken}`;
    const res = await fetch("/api/proxy/translate", {
      method: "POST",
      headers,
      body: JSON.stringify({ text, fromName, toName }),
    });
    if (res.status === 401 || res.status === 402) {
      return `[${res.status === 402 ? "Limit reached" : "Auth error"}] ${text}`;
    }
    if (!res.ok) return text;
    const data = await res.json();
    const result = data.result || text;
    _cache[cacheKey] = result;
    saveCache();
    return result;
  } catch {
    return text;
  }
}

export function engineStatus() {
  return { label: "Server keys", color: "#4ade80", dual: true };
}

export function setKeys(_openrouterKey: string, _sarvamKey: string) {}

export function getDeviceToken(): string | null { return _deviceToken; }
