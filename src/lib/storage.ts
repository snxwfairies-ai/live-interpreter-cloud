const webStore = {
  async get<T>(key: string): Promise<T | null> {
    try { const value = localStorage.getItem(key); return value ? (JSON.parse(value) as T) : null; } catch { return null; }
  },
  async set(key: string, value: unknown): Promise<void> {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  async del(key: string): Promise<void> {
    try { localStorage.removeItem(key); } catch {}
  },
};

const isNative = typeof window !== "undefined" && (window as any).Capacitor?.isNativePlatform?.();

let capStore: typeof webStore | null = null;

if (isNative) {
  try {
    const prefs = (window as any).Capacitor?.Plugins?.Preferences;
    if (prefs) {
      capStore = {
        async get<T>(key: string): Promise<T | null> {
          try { const { value } = await prefs.get({ key }); return value ? (JSON.parse(value) as T) : null; } catch { return null; }
        },
        async set(key: string, value: unknown): Promise<void> {
          try { await prefs.set({ key, value: JSON.stringify(value) }); } catch {}
        },
        async del(key: string): Promise<void> {
          try { await prefs.remove({ key }); } catch {}
        },
      };
    }
  } catch {}
}

export const store = capStore || webStore;

export const KEYS = {
  OPENROUTER_KEY:    "admin_openrouter_api_key",
  SARVAM_KEY:        "admin_sarvam_api_key",
  RC_PUBLIC_KEY:     "admin_rc_public_key",
  ROOM_SERVER_URL:   "admin_room_server_url",
  ADMIN_UNLOCKED:    "admin_unlocked",
  USER_NAME:         "user_name",
  USER_PLAN:         "user_plan",
  CALL_HISTORY:      "call_history",
  TRANSLATION_CACHE: "translation_cache",
  SESSION_COUNT:     "session_count_today",
  SESSION_DATE:      "session_date",
  DEFAULT_FROM:      "default_from_lang",
  DEFAULT_TO:        "default_to_lang",
};
