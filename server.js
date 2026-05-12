/**
 * Live Interpreter — Cloud Edition
 * snxwfairies innovations pvt. ltd
 *
 * Run locally:  node server.js
 * Run on cloud: set env vars OPENROUTER_API_KEY, SARVAM_API_KEY, ADMIN_SECRET
 */

const express  = require("express");
const http     = require("http");
const { WebSocketServer, WebSocket } = require("ws");
const path     = require("path");
const fs       = require("fs");
const os       = require("os");

// ── Load .env.local (local dev only) ─────────────────────────
const envFile = path.join(__dirname, ".env.local");
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, "utf8").split("\n").forEach(line => {
    const [k, ...v] = line.split("=");
    if (k && !k.startsWith("#") && !process.env[k.trim()])
      process.env[k.trim()] = v.join("=").trim();
  });
}

const PORT         = process.env.PORT || 3000;
const ADMIN_SECRET = process.env.ADMIN_SECRET || "snxwfairies-admin-2026";
const IS_CLOUD     = process.env.NODE_ENV === "production";

// ── Config: cloud uses env vars; local uses config.json ──────
const CONFIG_FILE = path.join(__dirname, "data", "config.json");
fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });

let config = {
  openrouterKey: process.env.OPENROUTER_API_KEY || "",
  sarvamKey: process.env.SARVAM_API_KEY || "",
};

// Load saved config (local overrides — ignored if env vars set)
if (fs.existsSync(CONFIG_FILE)) {
  try {
    const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    if (!config.openrouterKey) config.openrouterKey = saved.openrouterKey || "";
    if (!config.sarvamKey) config.sarvamKey = saved.sarvamKey || "";
  } catch {}
}

function saveConfig() {
  // Only save if not using env vars (don't overwrite cloud config)
  if (!process.env.OPENROUTER_API_KEY && !process.env.SARVAM_API_KEY) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  }
}

// ── Sarvam codes ──────────────────────────────────────────────
const SARVAM_CODES = {
  hi:"hi-IN", te:"te-IN", ta:"ta-IN", mr:"mr-IN",
  kn:"kn-IN", ml:"ml-IN", gu:"gu-IN", bn:"bn-IN", en:"en-IN",
};

// ── Express ───────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
app.use(express.json());

// ── Rate limiting (simple in-memory) ─────────────────────────
const reqCounts = new Map();
function rateLimit(req, res, next) {
  const ip  = req.ip || req.connection.remoteAddress;
  const now = Math.floor(Date.now() / 60000); // per minute bucket
  const key = `${ip}:${now}`;
  const count = (reqCounts.get(key) || 0) + 1;
  reqCounts.set(key, count);
  // Clean old entries
  if (reqCounts.size > 10000) {
    const cutoff = now - 2;
    for (const [k] of reqCounts) {
      if (Number(k.split(":")[1]) < cutoff) reqCounts.delete(k);
    }
  }
  if (count > 60) return res.status(429).json({ error: "Too many requests. Slow down." });
  next();
}
app.use("/api/translate", rateLimit);

// ── Translation ───────────────────────────────────────────────
async function translateSarvam(text, fromCode, toCode) {
  const res = await fetch("https://api.sarvam.ai/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-subscription-key": config.sarvamKey },
    body: JSON.stringify({
      input: text,
      source_language_code: SARVAM_CODES[fromCode] || "en-IN",
      target_language_code: SARVAM_CODES[toCode]   || "hi-IN",
      speaker_gender: "Female", mode: "formal", model: "mayura:v1", enable_preprocessing: true,
    }),
  });
  if (!res.ok) throw new Error(`Sarvam ${res.status}`);
  const d = await res.json();
  return { result: d.translated_text?.trim() || text, engine: "Sarvam.ai 🇮🇳" };
}

async function translateOpenRouter(text, fromName, toName) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.openrouterKey}`,
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
  return { result: d.choices?.[0]?.message?.content?.trim() || text, engine: "OpenRouter 🤖" };
}

// ── API: Translate ────────────────────────────────────────────
app.post("/api/translate", async (req, res) => {
  const { text, fromCode, toCode, fromName, toName } = req.body;
  if (!text?.trim()) return res.json({ result: "", engine: "" });

  if (!config.openrouterKey && !config.sarvamKey)
    return res.status(503).json({ error: "No API keys configured. Contact the administrator." });

  const bothIndian = SARVAM_CODES[fromCode] && SARVAM_CODES[toCode];

  try {
    if (config.sarvamKey && bothIndian) {
      try { return res.json(await translateSarvam(text, fromCode, toCode)); }
      catch (e) {
        console.warn("Sarvam failed, falling back to OpenRouter:", e.message);
        if (!config.openrouterKey) throw e;
      }
    }
    if (config.openrouterKey) return res.json(await translateOpenRouter(text, fromName, toName));
    return res.json(await translateSarvam(text, fromCode, toCode));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── API: Config (protected by admin secret) ───────────────────
app.get("/api/config", (_req, res) => {
  res.json({
    openrouterSet:  !!config.openrouterKey,
    sarvamSet:      !!config.sarvamKey,
    openrouterHint: config.openrouterKey ? config.openrouterKey.slice(0,10) + "…" : null,
    sarvamHint:     config.sarvamKey ? config.sarvamKey.slice(0,10) + "…" : null,
    isCloud:        IS_CLOUD,
    // On cloud, keys are set via env vars — show info
    cloudNote: IS_CLOUD ? "Keys managed via server environment variables." : null,
  });
});

// Set keys — requires admin secret header
app.post("/api/config", (req, res) => {
  const secret = req.headers["x-admin-secret"];
  if (!secret || secret !== ADMIN_SECRET)
    return res.status(403).json({ error: "Wrong admin secret. Check your ADMIN_SECRET environment variable." });

  const { openrouterKey, sarvamKey } = req.body;
  if (openrouterKey !== undefined) config.openrouterKey = openrouterKey.trim();
  if (sarvamKey !== undefined) config.sarvamKey = sarvamKey.trim();
  saveConfig();
  res.json({ ok: true, message: "Keys saved ✓" });
});

// ── Static files ──────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

// ── WebSocket Rooms ───────────────────────────────────────────
const wss   = new WebSocketServer({ server });
const rooms = new Map();

wss.on("connection", (ws) => {
  let roomId = null, user = null;

  ws.on("message", (raw) => {
    try {
      const d = JSON.parse(raw.toString());
      if (d.type === "join") {
        roomId = d.roomId || "main";
        user   = { id: d.userId, name: d.name || "Guest", lang: d.lang, micOn: d.micOn ?? true };
        if (!rooms.has(roomId)) rooms.set(roomId, new Set());
        rooms.get(roomId).add({ ws, ...user });
        bcast(roomId, { type: "user_joined", user }, ws);
        ws.send(JSON.stringify({ type: "room_state", members: getMembers(roomId) }));
      } else if (d.type === "speech")   bcast(roomId, { type:"speech",    ...d, userId:user?.id, userName:user?.name, timestamp:Date.now() }, ws);
        else if (d.type === "mic_status") bcast(roomId, { type:"mic_status", userId:user?.id, micOn:d.micOn }, ws);
        else if (d.type === "speaking")   bcast(roomId, { type:"speaking",   userId:user?.id, speaking:d.speaking }, ws);
    } catch {}
  });

  ws.on("close", () => {
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    for (const m of room) if (m.ws === ws) { room.delete(m); break; }
    if (room.size === 0) rooms.delete(roomId);
    else bcast(roomId, { type: "user_left", userId: user?.id });
  });
});

function bcast(roomId, data, excludeWs) {
  rooms.get(roomId)?.forEach(m => {
    if (m.ws !== excludeWs && m.ws.readyState === WebSocket.OPEN)
      m.ws.send(JSON.stringify(data));
  });
}
function getMembers(roomId) {
  return [...(rooms.get(roomId) || [])].map(m => ({ id:m.id, name:m.name, lang:m.lang, micOn:m.micOn }));
}

// ── Start ─────────────────────────────────────────────────────
server.listen(PORT, "0.0.0.0", () => {
  let localIP = "localhost";
  Object.values(os.networkInterfaces()).flat().forEach(i => {
    if (i.family === "IPv4" && !i.internal) localIP = i.address;
  });

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║  🧚 Live Interpreter — Cloud Edition              ║");
  console.log(`║  💻 Local  : http://localhost:${PORT}                 ║`);
  console.log(`║  📱 Network: http://${localIP}:${PORT}           ║`);
  console.log(`║  🔐 Admin  : set ADMIN_SECRET env var             ║`);
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`\n  OpenRouter key : ${config.openrouterKey ? "✅ Set" : "❌ Not set"}`);
  console.log(`  Sarvam key     : ${config.sarvamKey ? "✅ Set" : "❌ Not set"}`);
  if (!config.openrouterKey && !config.sarvamKey)
    console.log("\n  ⚠️  No API keys set — go to Settings in the app.\n");
  else
    console.log("\n  ✅ Ready to translate!\n");
});
