import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Key, Globe, CreditCard, Shield, Save, Eye, EyeOff, X, CheckCircle, AlertCircle } from "lucide-react";
import { store, KEYS } from "../lib/storage";
import { setKeys } from "../lib/translation";
import { initRevenueCat } from "../lib/subscription";

interface Props { onClose: () => void; }

export function AdminPanel({ onClose }: Props) {
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [sarvamKey, setSarvamKey] = useState("");
  const [rcKey, setRcKey] = useState("");
  const [roomUrl, setRoomUrl] = useState("ws://192.168.1.100:3000");
  const [saved, setSaved] = useState(false);
  const [show, setShow] = useState({ openrouter: false, sarvam: false, rc: false });

  useEffect(() => {
    (async () => {
      setOpenrouterKey(await store.get<string>(KEYS.OPENROUTER_KEY) || "");
      setSarvamKey(await store.get<string>(KEYS.SARVAM_KEY) || "");
      setRcKey(await store.get<string>(KEYS.RC_PUBLIC_KEY) || "");
      setRoomUrl(await store.get<string>(KEYS.ROOM_SERVER_URL) || "ws://192.168.1.100:3000");
    })();
  }, []);

  const save = async () => {
    await store.set(KEYS.OPENROUTER_KEY, openrouterKey.trim());
    await store.set(KEYS.SARVAM_KEY, sarvamKey.trim());
    await store.set(KEYS.RC_PUBLIC_KEY, rcKey.trim());
    await store.set(KEYS.ROOM_SERVER_URL, roomUrl.trim());
    setKeys(openrouterKey.trim(), sarvamKey.trim());
    if (rcKey.trim()) await initRevenueCat(rcKey.trim(), "admin");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const statusIcon = (val: string) =>
    val.trim() ? <CheckCircle size={14} color="#4ade80" /> : <AlertCircle size={14} color="#f87171" />;

  const field = (
    label: string, hint: string, value: string, onChange: (v: string) => void,
    showKey: boolean, toggleShow: () => void, icon: React.ReactNode
  ) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2">{icon}<span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</span></div>
        {statusIcon(value)}
      </div>
      <div className="flex gap-2">
        <input type={showKey ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)}
          placeholder={hint} className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500/40 font-mono" />
        <button onClick={toggleShow} className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl cursor-pointer">
          {showKey ? <EyeOff size={14} color="#6b7280" /> : <Eye size={14} color="#6b7280" />}
        </button>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end justify-center"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
        className="w-full max-w-lg bg-[#0a0f1e] border border-white/10 rounded-t-3xl p-6 max-h-[90dvh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1"><Shield size={18} color="#f472b6" /><span className="text-[15px] font-black text-white">Super Admin Panel</span></div>
            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">API keys stored on-device only</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer"><X size={16} color="#6b7280" /></button>
        </div>
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-3.5 mb-5">
          <div className="text-[11px] text-blue-300 font-bold leading-relaxed">🔐 API keys are stored in encrypted device storage. They are never transmitted to any server other than the respective AI providers.</div>
        </div>
        {field("OpenRouter API Key", "sk-or-v1-…", openrouterKey, setOpenrouterKey,
          show.openrouter, () => setShow(s => ({ ...s, openrouter: !s.openrouter })),
          <Key size={13} color="#60a5fa" />)}
        {field("Sarvam.ai API Key", "Paste key from console.sarvam.ai", sarvamKey, setSarvamKey,
          show.sarvam, () => setShow(s => ({ ...s, sarvam: !s.sarvam })),
          <Key size={13} color="#f472b6" />)}
        <div className="mb-4 bg-white/[0.03] border border-white/5 rounded-xl p-3">
          <div className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-2">Translation Routing</div>
          <div className="space-y-1.5">
            {[
              { label: "Indian languages (hi, te, ta, mr, kn, ml, gu, bn)", engine: "Sarvam.ai (Mayura)", active: !!sarvamKey },
              { label: "Indian ↔ Non-Indian (pivot via English)", engine: "Sarvam + OpenRouter", active: !!sarvamKey && !!openrouterKey },
              { label: "Non-Indian pairs (ar, fr, de, ja, zh, es, ru)", engine: "OpenRouter", active: !!openrouterKey },
            ].map((r, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-[9px] text-zinc-500 font-medium">{r.label}</span>
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${r.active ? "bg-green-500/15 text-green-400" : "bg-red-500/10 text-red-400"}`}>{r.engine}</span>
              </div>
            ))}
          </div>
        </div>
        {field("RevenueCat Public Key", "appl_… or goog_…", rcKey, setRcKey,
          show.rc, () => setShow(s => ({ ...s, rc: !s.rc })),
          <CreditCard size={13} color="#fbbf24" />)}
        <div className="text-[8px] text-zinc-600 -mt-2 mb-4 uppercase tracking-widest">Get from app.revenuecat.com → Your App → API Keys → Public SDK Key</div>
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1.5"><Globe size={13} color="#a78bfa" /><span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Room Server URL (WebSocket)</span></div>
          <input type="text" value={roomUrl} onChange={e => setRoomUrl(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500/40 font-mono"
            placeholder="ws://192.168.x.x:3000" />
          <div className="text-[8px] text-zinc-600 mt-1.5 uppercase tracking-widest">For multi-user rooms. Leave blank to disable room feature.</div>
        </div>
        <button onClick={save}
          className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border-none cursor-pointer transition-all ${saved ? "bg-green-600 text-white" : "bg-gradient-to-r from-pink-600 to-purple-700 text-white"}`}>
          {saved ? <><CheckCircle size={16} /> Saved!</> : <><Save size={16} /> Save Configuration</>}
        </button>
        <div className="text-center mt-4 text-[8px] text-zinc-700 font-bold uppercase tracking-widest">Live Interpreter v1.0 · Admin Build · snxwfairies innovations</div>
      </motion.div>
    </motion.div>
  );
}
