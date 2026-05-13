import React, { useState, useEffect, useCallback } from "react";
import { Key, Users, BarChart3, Settings, LogOut, Eye, EyeOff, CheckCircle, XCircle, RefreshCw, Shield, Loader2, TrendingUp, Clock, Globe, DollarSign, ChevronRight, Lock, AlertTriangle, Check, X } from "lucide-react";

const API = (path: string, method = "GET", body?: any) => {
  const token = localStorage.getItem("adminToken");
  return fetch(`/api${path}`, {
    method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  }).then(r => r.json());
};

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    setLoading(true); setError("");
    const res = await API("/auth/admin", "POST", { password: pw });
    setLoading(false);
    if (res.token) { localStorage.setItem("adminToken", res.token); onLogin(); }
    else setError(res.error || "Wrong password");
  };
  return (
    <div className="min-h-screen bg-[#04070f] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🧚</div>
          <div className="text-2xl font-black text-white tracking-tight">Admin Panel</div>
          <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">snxwfairies innovations</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
          <div className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">Admin Password</div>
          <div className="relative mb-4">
            <input type={show ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="Enter admin password" className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white outline-none focus:border-blue-500/50 pr-12" />
            <button onClick={() => setShow(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 bg-transparent border-none cursor-pointer">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
          {error && <div className="text-xs text-red-400 font-bold mb-4 flex items-center gap-2"><AlertTriangle size={12} />{error}</div>}
          <button onClick={submit} disabled={!pw || loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black text-sm uppercase tracking-widest border-none cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}{loading ? "Signing in…" : "Sign In"}
          </button>
        </div>
        <div className="text-center text-xs text-zinc-700 font-bold uppercase tracking-widest mt-6">Live Interpreter Pro · Admin Access Only</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, delta, icon }: any) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3"><div className="text-zinc-500">{icon}</div>{delta && <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-green-500/10 text-green-400">{delta}</span>}</div>
      <div className="text-3xl font-black text-white font-mono mb-1">{value}</div>
      <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{label}</div>
    </div>
  );
}

function ApiKeysTab() {
  const [keys, setKeys] = useState<any>(null);
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [sarvamKey, setSarvamKey] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const load = useCallback(async () => { const res = await API("/admin/keys"); setKeys(res); }, []);
  useEffect(() => { load(); }, [load]);
  const save = async (provider: string, key: string) => {
    setLoading(provider); setMsg(null);
    const res = await API("/admin/keys", "POST", { provider, key });
    setLoading(null);
    setMsg({ text: res.message || res.error, ok: !res.error });
    if (!res.error) { load(); if (provider === "openrouter") setOpenrouterKey(""); else setSarvamKey(""); }
  };
  const providers = [
    { id: "openrouter", name: "OpenRouter", icon: "🤖", description: "All languages via 200+ models (Claude, GPT, Gemini, Llama)", docs: "https://openrouter.ai/keys", placeholder: "sk-or-v1-…", key: openrouterKey, setKey: setOpenrouterKey, badge: "All Languages" },
    { id: "sarvam", name: "Sarvam.ai", icon: "🇮🇳", description: "Best for Indian language pairs", docs: "https://dashboard.sarvam.ai/", placeholder: "sarvam_api_…", key: sarvamKey, setKey: setSarvamKey, badge: "Indian Languages" },
  ];
  return (
    <div className="space-y-6">
      <div><div className="text-xl font-black text-white mb-1">API Keys</div><div className="text-sm text-zinc-500 font-medium">Smart routing: <span className="text-teal-400 font-bold">Sarvam.ai for Indian languages</span> → <span className="text-purple-400 font-bold">OpenRouter for others</span></div></div>
      {msg && <div className={`flex items-center gap-3 p-4 rounded-2xl border ${msg.ok ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>{msg.ok ? <Check size={16} /> : <X size={16} />}<span className="text-sm font-bold">{msg.text}</span></div>}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-white/10 rounded-2xl p-5">
        <div className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3">Smart Routing</div>
        <div className="flex items-center gap-3 flex-wrap text-sm">
          <div className="bg-white/10 rounded-xl px-3 py-1.5 text-white font-bold">Hindi ↔ Tamil</div><ChevronRight size={14} className="text-zinc-600" />
          <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl px-3 py-1.5 text-orange-300 font-bold">🇮🇳 Sarvam.ai</div>
          <div className="text-zinc-600 mx-2">|</div>
          <div className="bg-white/10 rounded-xl px-3 py-1.5 text-white font-bold">English ↔ Arabic</div><ChevronRight size={14} className="text-zinc-600" />
          <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl px-3 py-1.5 text-purple-300 font-bold">🤖 OpenRouter</div>
        </div>
      </div>
      {providers.map(p => (
        <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3"><span className="text-3xl">{p.icon}</span>
              <div><div className="text-base font-black text-white flex items-center gap-2">{p.name}<span className="text-[10px] font-black bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-lg border border-blue-500/20 uppercase tracking-wider">{p.badge}</span></div>
                <div className="text-xs text-zinc-500 font-medium mt-0.5">{p.description}</div></div>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black ${keys?.[`${p.id}_set`] ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              {keys?.[`${p.id}_set`] ? <><CheckCircle size={12} />Active</> : <><XCircle size={12} />Not Set</>}
            </div>
          </div>
          {keys?.[p.id] && <div className="bg-black/20 rounded-xl px-4 py-2.5 font-mono text-sm text-zinc-400 mb-4 border border-white/5">{keys[p.id]}</div>}
          <div className="flex gap-3">
            <input type="password" value={p.key} onChange={e => p.setKey(e.target.value)} placeholder={p.placeholder}
              className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500/50 font-mono" />
            <button onClick={() => save(p.id, p.key)} disabled={!p.key.trim() || loading === p.id}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-black text-sm border-none cursor-pointer disabled:opacity-40 flex items-center gap-2 whitespace-nowrap">
              {loading === p.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save & Verify
            </button>
          </div>
          <a href={p.docs} target="_blank" rel="noreferrer" className="text-xs text-blue-500 font-bold mt-2 inline-block">Get API key →</a>
        </div>
      ))}
    </div>
  );
}

function AnalyticsTab() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { API("/admin/analytics").then(setData); }, []);
  if (!data) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-zinc-600" /></div>;
  const { summary, dailySessions } = data;
  const maxBar = Math.max(...(dailySessions?.map((d: any) => d.n) || [1]), 1);
  const planColors: Record<string, string> = { free: "#6b7280", starter: "#3b82f6", pro: "#8b5cf6", business: "#f59e0b", enterprise: "#10b981" };
  return (
    <div className="space-y-6">
      <div className="text-xl font-black text-white">Analytics <span className="text-zinc-500 text-base font-normal ml-2">{summary.totalUsers} users</span></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Today" value={summary.activeToday} icon={<TrendingUp size={18} />} />
        <StatCard label="Total Sessions" value={summary.totalSessions} icon={<Clock size={18} />} />
        <StatCard label="Minutes Used" value={`${summary.totalMinutes?.toLocaleString()}m`} icon={<Clock size={18} />} />
        <StatCard label="Revenue (INR)" value={`₹${summary.revenueTotal?.toLocaleString() || 0}`} icon={<DollarSign size={18} />} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Paid Users" value={summary.paidUsers} icon={<Shield size={18} />} />
        <StatCard label="Sarvam Calls" value={summary.sarvamCalls} icon={<Globe size={18} />} />
        <StatCard label="OpenRouter Calls" value={summary.openrouterCalls} icon={<Key size={18} />} />
        <StatCard label="Total Users" value={summary.totalUsers} icon={<Users size={18} />} />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="text-sm font-black text-white mb-4 uppercase tracking-widest">Users by Plan</div>
        <div className="space-y-3">
          {summary.planBreakdown?.map((p: any) => {
            const pct = Math.round((p.n / summary.totalUsers) * 100) || 0;
            return (<div key={p.plan}><div className="flex justify-between mb-1.5"><span className="text-sm font-bold text-white capitalize">{p.plan}</span><span className="text-sm font-black font-mono" style={{ color: planColors[p.plan] || "#fff" }}>{p.n} ({pct}%)</span></div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: planColors[p.plan] || "#fff" }} /></div></div>);
          })}
        </div>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="text-sm font-black text-white mb-4 uppercase tracking-widest">Daily Sessions — Last 7 Days</div>
        <div className="flex items-end gap-2 h-24">
          {dailySessions?.map((d: any, i: number) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-[9px] text-zinc-500 font-bold font-mono">{d.n}</div>
              <div className="w-full rounded-t-sm bg-blue-600/80" style={{ height: `${(d.n / maxBar) * 70}px`, minHeight: 4 }} />
              <div className="text-[9px] text-zinc-600 font-bold">{d.day?.slice(5)}</div>
            </div>
          ))}
          {(!dailySessions || dailySessions.length === 0) && <div className="flex-1 text-center text-zinc-600 text-sm py-8">No data yet</div>}
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const load = () => API("/admin/users?limit=100").then(setData);
  useEffect(() => { load(); }, []);
  const setPlan = async (id: string, plan: string) => { setLoading(id); await API(`/admin/users/${id}/plan`, "POST", { plan }); setLoading(null); load(); };
  const toggleBlock = async (id: string, blocked: boolean) => { setLoading(id + "block"); await API(`/admin/users/${id}/block`, "POST", { blocked: !blocked }); setLoading(null); load(); };
  const planColors: Record<string, string> = { free: "text-zinc-400", starter: "text-blue-400", pro: "text-purple-400", business: "text-amber-400", enterprise: "text-emerald-400" };
  const filtered = data?.users?.filter((u: any) => !search || u.id.includes(search) || u.email?.includes(search)) || [];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xl font-black text-white">Users <span className="text-zinc-500 text-base font-normal ml-2">{data?.total || 0} total</span></div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID or email…" className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-blue-500/50 w-64" />
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10">{["User ID", "Plan", "Sessions", "Minutes", "Actions"].map(h => <th key={h} className="text-left px-5 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest">{h}</th>)}</tr></thead>
          <tbody>{filtered.map((u: any) => (
            <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="px-5 py-3.5"><div className="text-xs font-mono text-white/80">{u.id.slice(0, 16)}…</div>{u.email && <div className="text-xs text-zinc-500 mt-0.5">{u.email}</div>}{u.is_blocked === 1 && <div className="text-xs text-red-500 font-bold mt-0.5">🚫 Blocked</div>}</td>
              <td className="px-5 py-3.5"><select value={u.plan} onChange={e => setPlan(u.id, e.target.value)} className={`bg-transparent border-none text-xs font-black uppercase cursor-pointer outline-none ${planColors[u.plan] || "text-white"}`}>{["free", "starter", "pro", "business", "enterprise"].map(p => <option key={p} value={p}>{p}</option>)}</select>{loading === u.id && <Loader2 size={10} className="animate-spin text-blue-500 ml-1 inline" />}</td>
              <td className="px-5 py-3.5"><div className="text-xs text-white font-mono">{u.total_sessions}</div><div className="text-xs text-zinc-600">Today: {u.sessions_today}</div></td>
              <td className="px-5 py-3.5 text-xs text-white font-mono">{Math.round(u.total_minutes || 0)}m</td>
              <td className="px-5 py-3.5"><button onClick={() => toggleBlock(u.id, u.is_blocked === 1)} disabled={loading === u.id + "block"} className={`text-[10px] font-black px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all ${u.is_blocked === 1 ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>{u.is_blocked === 1 ? "Unblock" : "Block"}</button></td>
            </tr>))}</tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-zinc-600 text-sm">No users found</div>}
      </div>
    </div>
  );
}

function AdminSettingsTab({ onLogout }: { onLogout: () => void }) {
  const [newPass, setNewPass] = useState(""); const [confirm, setConfirm] = useState(""); const [msg, setMsg] = useState(""); const [loading, setLoading] = useState(false);
  const changePass = async () => { if (newPass !== confirm) { setMsg("Passwords don't match"); return; } if (newPass.length < 8) { setMsg("Min 8 characters"); return; } setLoading(true); const res = await API("/admin/password", "POST", { newPassword: newPass }); setLoading(false); setMsg(res.ok ? "✅ Password updated" : res.error); if (res.ok) { setNewPass(""); setConfirm(""); } };
  return (
    <div className="space-y-6 max-w-lg">
      <div className="text-xl font-black text-white">Admin Settings</div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="text-sm font-black text-white mb-4">Change Admin Password</div>
        <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none mb-3" />
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm password" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none mb-4" />
        {msg && <div className={`text-xs font-bold mb-4 ${msg.includes("✅") ? "text-green-400" : "text-red-400"}`}>{msg}</div>}
        <button onClick={changePass} disabled={loading || !newPass} className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-black text-sm border-none cursor-pointer disabled:opacity-40">{loading ? "Saving…" : "Update Password"}</button>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="text-sm font-black text-white mb-2">RevenueCat Webhook URL</div>
        <div className="text-xs text-zinc-500 font-medium mb-3">Add this URL in RevenueCat dashboard → Integrations → Webhooks</div>
        <div className="bg-black/20 border border-white/5 rounded-xl px-4 py-3 font-mono text-sm text-blue-400 break-all">{window.location.origin}/api/webhook/revenuecat</div>
      </div>
      <button onClick={onLogout} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-black text-sm cursor-pointer"><LogOut size={14} /> Sign Out</button>
    </div>
  );
}

export default function AdminApp() {
  const [authed, setAuthed] = useState(!!localStorage.getItem("adminToken"));
  const [tab, setTab] = useState("keys");
  const logout = () => { localStorage.removeItem("adminToken"); setAuthed(false); };
  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;
  const tabs = [
    { id: "keys", label: "API Keys", icon: <Key size={16} /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
    { id: "users", label: "Users", icon: <Users size={16} /> },
    { id: "settings", label: "Settings", icon: <Settings size={16} /> },
  ];
  return (
    <div className="min-h-screen bg-[#04070f] font-sans">
      <div className="flex min-h-screen">
        <div className="w-56 bg-black/30 border-r border-white/5 flex flex-col p-4 flex-shrink-0">
          <div className="flex items-center gap-2.5 mb-8 px-2 pt-2"><span className="text-2xl">🧚</span><div><div className="text-xs font-black text-white">Admin Panel</div><div className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">snxwfairies</div></div></div>
          <nav className="flex-1 space-y-1">{tabs.map(t => (<button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer border-none text-left ${tab === t.id ? "bg-blue-600/20 text-blue-400" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 bg-transparent"}`}>{t.icon}{t.label}</button>))}</nav>
          <button onClick={logout} className="flex items-center gap-2 px-4 py-3 text-xs text-zinc-600 hover:text-red-400 transition-colors font-bold cursor-pointer bg-transparent border-none mt-4"><LogOut size={13} /> Sign Out</button>
        </div>
        <div className="flex-1 overflow-auto p-8"><div className="max-w-4xl">{tab === "keys" && <ApiKeysTab />}{tab === "analytics" && <AnalyticsTab />}{tab === "users" && <UsersTab />}{tab === "settings" && <AdminSettingsTab onLogout={logout} />}</div></div>
      </div>
    </div>
  );
}
