import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { translate } from "./translate.js";
import { db, ApiKeys, Users, Admin, Analytics } from "./db.js";
import { PLANS, getPlan, canStartSession, canJoinRoom, isPlanExpired } from "./plans.js";
import { validateOpenRouterKey, validateSarvamKey } from "./translate.js";

dotenv.config({ path: ".env.local" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || "snxwfairies-live-interpreter-secret-2026";

const app    = express();
const server = http.createServer(app);
app.use(express.json({ limit: "2mb" }));

function authMiddleware(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

function adminMiddleware(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (!payload.isAdmin) return res.status(403).json({ error: "Not admin" });
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

app.post("/api/auth/device", (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) return res.status(400).json({ error: "deviceId required" });
  Users.upsert(deviceId);
  Users.resetDailyIfNeeded(deviceId);
  const user = Users.get(deviceId);
  if (isPlanExpired(user) && user.plan !== "free") {
    Users.setPlan(deviceId, "free", null);
    user.plan = "free";
  }
  const token = jwt.sign({ userId: deviceId }, JWT_SECRET, { expiresIn: "90d" });
  res.json({ token, user: { id: user.id, plan: user.plan, sessionsToday: user.sessions_today } });
});

app.post("/api/auth/admin", (req, res) => {
  const { password } = req.body;
  if (!Admin.check(password)) return res.status(401).json({ error: "Wrong password" });
  const token = jwt.sign({ isAdmin: true }, JWT_SECRET, { expiresIn: "24h" });
  res.json({ token });
});

app.post("/api/translate", authMiddleware, async (req: any, res) => {
  const { text, fromCode, toCode, fromName, toName } = req.body;
  if (!text || !fromCode || !toCode) return res.status(400).json({ error: "Missing fields" });
  const user = Users.get(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  const check = canStartSession(user);
  if (!check.ok) return res.status(402).json({ error: check.reason, upgrade: true });
  const hasKeys = ApiKeys.get("sarvam") || ApiKeys.get("openrouter");
  if (!hasKeys) return res.status(503).json({ error: "Translation service not configured." });
  try {
    const { result, engine } = await translate(text, fromCode, toCode, fromName, toName);
    res.json({ result, engine });
  } catch (e: any) {
    console.error("Translation error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/session/start", authMiddleware, (req: any, res) => {
  const user = Users.get(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  const check = canStartSession(user);
  if (!check.ok) return res.status(402).json({ error: check.reason, upgrade: true });
  const plan = getPlan(user.plan);
  Users.incrementSession(req.userId);
  const sessionId = `${req.userId}-${Date.now()}`;
  db.prepare("INSERT INTO sessions (id, user_id, from_lang, to_lang) VALUES (?,?,?,?)").run(sessionId, req.userId, req.body.fromLang || "", req.body.toLang || "");
  res.json({ sessionId, maxMinutes: plan.max_session_mins });
});

app.post("/api/session/end", authMiddleware, (req: any, res) => {
  const { sessionId, durationSeconds } = req.body;
  if (sessionId && durationSeconds) {
    db.prepare("UPDATE sessions SET duration_seconds=? WHERE id=?").run(durationSeconds, sessionId);
    Users.addMinutes(req.userId, durationSeconds / 60);
  }
  res.json({ ok: true });
});

app.post("/api/webhook/revenuecat", express.raw({ type: "application/json" }), (req, res) => {
  try {
    const payload = JSON.parse(req.body.toString()) as any;
    const event   = payload.event;
    const userId  = event?.app_user_id;
    const productId = event?.product_id || "";
    let plan = "free";
    for (const [id, p] of Object.entries(PLANS)) {
      if (p.play_product_id === productId) { plan = id; break; }
    }
    if (userId && plan) {
      if (["INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE", "UNCANCELLATION"].includes(event.type)) {
        const expiresAt = event.expiration_at_ms ? Math.floor(event.expiration_at_ms / 1000) : null;
        Users.setPlan(userId, plan, expiresAt);
        db.prepare("INSERT OR IGNORE INTO revenue (id, user_id, plan, amount_inr, product_id, verified) VALUES (?,?,?,?,?,1)").run(event.id, userId, plan, event.price || 0, productId);
      } else if (["CANCELLATION", "EXPIRATION"].includes(event.type)) {
        Users.setPlan(userId, "free", null);
      }
    }
    res.sendStatus(200);
  } catch (e: any) {
    console.error("Webhook error:", e);
    res.sendStatus(400);
  }
});

app.post("/api/subscription/set", authMiddleware, (req: any, res) => {
  const { plan, expiresAt } = req.body;
  if (!Object.keys(PLANS).includes(plan)) return res.status(400).json({ error: "Invalid plan" });
  Users.setPlan(req.userId, plan, expiresAt || null);
  res.json({ ok: true, plan });
});

app.get("/api/subscription/status", authMiddleware, (req: any, res) => {
  const user = Users.get(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  const plan = getPlan(user.plan);
  res.json({ plan: user.plan, expires_at: user.plan_expires_at, limits: plan, sessions_today: user.sessions_today });
});

app.get("/api/admin/keys", adminMiddleware, (_req, res) => {
  const openrouter = ApiKeys.get("openrouter");
  const sarvam = ApiKeys.get("sarvam");
  res.json({
    openrouter: openrouter ? `${openrouter.slice(0, 8)}…${openrouter.slice(-4)}` : null,
    sarvam: sarvam ? `${sarvam.slice(0, 8)}…${sarvam.slice(-4)}` : null,
    openrouter_set: !!openrouter,
    sarvam_set: !!sarvam,
  });
});

app.post("/api/admin/keys", adminMiddleware, async (req, res) => {
  const { provider, key } = req.body;
  if (!["openrouter", "sarvam"].includes(provider)) return res.status(400).json({ error: "Invalid provider" });
  if (!key?.trim()) return res.status(400).json({ error: "Key is empty" });
  let valid = false;
  if (provider === "openrouter") valid = await validateOpenRouterKey(key.trim());
  if (provider === "sarvam") valid = await validateSarvamKey(key.trim());
  if (!valid) return res.status(400).json({ error: `Invalid ${provider} API key.` });
  ApiKeys.set(provider, key.trim());
  res.json({ ok: true, message: `${provider} key saved ✓` });
});

app.get("/api/admin/analytics", adminMiddleware, (_req, res) => {
  res.json({ summary: Analytics.summary(), dailySessions: Analytics.dailySessions() });
});

app.get("/api/admin/users", adminMiddleware, (req, res) => {
  const page  = Number(req.query.page  || 0);
  const limit = Number(req.query.limit || 50);
  const users = Users.list(limit, page * limit);
  const total = Users.count();
  res.json({ users, total, page, pages: Math.ceil(total / limit) });
});

app.post("/api/admin/users/:id/plan", adminMiddleware, (req, res) => {
  const { plan } = req.body;
  if (!Object.keys(PLANS).includes(plan)) return res.status(400).json({ error: "Invalid plan" });
  Users.setPlan(req.params.id, plan, null);
  res.json({ ok: true });
});

app.post("/api/admin/users/:id/block", adminMiddleware, (req, res) => {
  const { blocked } = req.body;
  db.prepare("UPDATE users SET is_blocked=? WHERE id=?").run(blocked ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

app.post("/api/admin/password", adminMiddleware, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
  Admin.setPassword(newPassword);
  res.json({ ok: true });
});

app.get("/api/plans", (_req, res) => res.json({ plans: PLANS }));

// ── Simple translate proxy (no auth, uses server env/DB keys) ──
const NAME_TO_CODE: Record<string, string> = {
  hindi: "hi", telugu: "te", tamil: "ta", marathi: "mr",
  kannada: "kn", malayalam: "ml", gujarati: "gu", bengali: "bn",
  english: "en", arabic: "ar",
};
app.post("/api/proxy/translate", async (req, res) => {
  const { text, fromName, toName } = req.body;
  if (!text?.trim() || !fromName || !toName) return res.status(400).json({ error: "Missing fields" });
  try {
    const fromCode = NAME_TO_CODE[fromName.toLowerCase()] || "en";
    const toCode   = NAME_TO_CODE[toName.toLowerCase()]   || "hi";
    const { result, engine } = await translate(text, fromCode, toCode, fromName, toName);
    res.json({ result, engine });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

const wss  = new WebSocketServer({ server });
const rooms = new Map<string, Set<any>>();

wss.on("connection", (ws: any) => {
  let currentRoom: string | null = null;
  let userData: any = null;
  ws.on("message", async (raw: Buffer) => {
    try {
      const data = JSON.parse(raw.toString());
      switch (data.type) {
        case "join": {
          let userId = data.userId;
          const user = userId ? Users.get(userId) : null;
          const check = user ? canJoinRoom(user) : { ok: false, reason: "Not authenticated" };
          if (!check.ok) { ws.send(JSON.stringify({ type: "error", message: check.reason })); ws.close(); return; }
          currentRoom = data.roomId || "default";
          userData = { id: userId, name: data.name || "Guest", lang: data.lang, micOn: data.micOn ?? true, speaking: false };
          if (!rooms.has(currentRoom)) rooms.set(currentRoom, new Set());
          rooms.get(currentRoom)!.add({ ws, ...userData });
          broadcast(currentRoom, { type: "user_joined", user: userData }, ws);
          const members = [...rooms.get(currentRoom)!].map((m: any) => ({ id: m.id, name: m.name, lang: m.lang, micOn: m.micOn, speaking: m.speaking }));
          ws.send(JSON.stringify({ type: "room_state", members }));
          break;
        }
        case "mic_status":
          if (currentRoom) { rooms.get(currentRoom)?.forEach((m: any) => { if (m.ws === ws) m.micOn = data.micOn; }); broadcast(currentRoom, { type: "mic_status", userId: userData.id, micOn: data.micOn }, ws); }
          break;
        case "speaking_status":
          if (currentRoom) broadcast(currentRoom, { type: "speaking_status", userId: userData.id, speaking: data.speaking }, ws);
          break;
        case "speech":
          if (currentRoom) broadcast(currentRoom, { type: "speech", userId: userData.id, userName: userData.name, text: data.text, sourceLang: data.lang, timestamp: Date.now() }, ws);
          break;
        case "ping": ws.send(JSON.stringify({ type: "pong" })); break;
      }
    } catch (e) { console.error("WS error:", e); }
  });
  ws.on("close", () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom)!;
      for (const m of room) if (m.ws === ws) { room.delete(m); break; }
      if (room.size === 0) rooms.delete(currentRoom);
      else broadcast(currentRoom, { type: "user_left", userId: userData?.id });
    }
  });
});

function broadcast(roomId: string, data: any, excludeWs?: any) {
  const msg = JSON.stringify(data);
  rooms.get(roomId)?.forEach((m: any) => {
    if (m.ws !== excludeWs && m.ws.readyState === WebSocket.OPEN) m.ws.send(msg);
  });
}

const DIST = path.join(__dirname, "../../dist");

if (process.env.NODE_ENV === "production") {
  app.use(express.static(DIST));
  app.get("/admin*", (_req, res) => res.sendFile(path.join(DIST, "admin.html")));
  app.get("*",       (_req, res) => res.sendFile(path.join(DIST, "index.html")));
} else {
  const { createServer: createVite } = await import("vite");
  const vite = await createVite({ server: { middlewareMode: true }, appType: "custom" });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    try {
      const url = req.originalUrl;
      const template = await vite.transformIndexHtml(url, "");
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e: any) { vite.ssrFixStacktrace(e); next(e); }
  });
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║  🧚 Live Interpreter Pro — Server Started    ║`);
  console.log(`║  🌐 App:   http://localhost:${PORT}              ║`);
  console.log(`║  🔐 Admin: http://localhost:${PORT}/admin        ║`);
  console.log(`╚══════════════════════════════════════════════╝\n`);
});
