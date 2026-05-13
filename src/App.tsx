/**
 * Live Interpreter Pro
 * © 2026 snxwfairies innovations pvt. ltd
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Phone, Tv, Users, Mic, MicOff, Settings, Globe,
  MessageSquare, ChevronRight, ArrowLeftRight, Headphones,
  Cloud, Lock, Info, BarChart3, HelpCircle, History,
  Square, Star, Shield, Loader2, WifiOff, Zap,
  Crown, AlertTriangle, CheckCircle, RefreshCw,
} from "lucide-react";

import { LANGS, LANG_MAP, PLANS, PlanId } from "./lib/constants";
import { store, KEYS } from "./lib/storage";
import { setKeys, translateText, engineStatus, loadCache } from "./lib/translation";
import {
  initRevenueCat, getCurrentPlan, purchasePlan, restorePurchases,
  canStartSession, recordSession, canUseFeature, maxParticipants,
} from "./lib/subscription";
import { AdminPanel } from "./components/AdminPanel";

// ─── Types ───────────────────────────────────────────────────────────────────
type Lang = typeof LANGS[0];
interface CallEntry { participant:string; fromLang:string; toLang:string; duration:string; timestamp:number; }

// ─── Shared: WaveBar ─────────────────────────────────────────────────────────
function WaveBar({ active, height, delay }: { active:boolean; height:number; delay:number }) {
  const dur = useRef(0.4+Math.random()*0.4).current;
  return (
    <div className={active?"wave-bar":""} style={{
      width:3,borderRadius:2,flexShrink:0,transition:"height 0.3s",
      height:active?height:4,
      background:active?"linear-gradient(to top,#1565C0,#42A5F5)":"rgba(255,255,255,0.07)",
      ["--wh"as any]:`${height}px`,["--wd"as any]:`${dur}s`,
      animationDelay:`${delay}ms`,
    }}/>
  );
}

// ─── Shared: LangPicker ──────────────────────────────────────────────────────
function LangPicker({ title, selected, onPick, onClose, availableCodes }:{
  title:string; selected:Lang; onPick:(l:Lang)=>void; onClose:()=>void; availableCodes?:string[];
}) {
  const langs = availableCodes
    ? LANGS.filter(l=>availableCodes.includes(l.code))
    : LANGS;
  return (
    <motion.div initial={{opacity:0,y:60}} animate={{opacity:1,y:0}} exit={{opacity:0,y:60}}
      className="absolute inset-0 z-50 bg-[#060B18] p-5 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[11px] font-black text-white uppercase tracking-[0.15em]">{title}</span>
        <button onClick={onClose} className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-transparent border-none cursor-pointer">Done</button>
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto grid grid-cols-2 gap-2 pb-10">
        {langs.map(l=>(
          <button key={l.code} onClick={()=>{onPick(l);onClose();}}
            className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${selected.code===l.code?"bg-blue-600/20 border-blue-500":"bg-white/5 border-white/10"}`}>
            <div className="text-2xl mb-1">{l.flag}</div>
            <div className="text-[11px] font-black text-white">{l.name}</div>
            <div className="text-[9px] text-zinc-500 font-bold">{l.script}</div>
            {l.indian && <div className="text-[7px] text-teal-500 font-black mt-1 uppercase tracking-widest">Sarvam.ai</div>}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Shared: GateBanner ──────────────────────────────────────────────────────
function GateBanner({ msg, onUpgrade }:{ msg:string; onUpgrade:()=>void }) {
  return (
    <div className="mx-4 mb-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex gap-3 items-center">
      <Crown size={20} color="#fbbf24" className="flex-shrink-0"/>
      <div className="flex-1">
        <div className="text-[11px] font-black text-amber-300">{msg}</div>
      </div>
      <button onClick={onUpgrade}
        className="text-[9px] font-black bg-amber-500/20 border border-amber-500/30 text-amber-400 px-2.5 py-1.5 rounded-lg cursor-pointer uppercase tracking-widest">
        Upgrade
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// CALL SCREEN
// ═══════════════════════════════════════════════════════════
function CallScreen({ plan, onNav, userName }:{plan:PlanId;onNav:(s:string)=>void;userName:string}) {
  const [active,setActive]         = useState(false);
  const [fromLang,setFromLang]     = useState(LANGS[0]);
  const [toLang,setToLang]         = useState(LANGS[3]);
  const [transcript,setTranscript] = useState<{orig:string;trans:string}[]>([]);
  const [latency,setLatency]       = useState<number|null>(null);
  const [showOrig,setShowOrig]     = useState(true);
  const [duration,setDuration]     = useState(0);
  const [picker,setPicker]         = useState<"from"|"to"|null>(null);
  const [translating,setTranslating]=useState(false);
  const [gateMsg,setGateMsg]       = useState("");
  const recRef = useRef<any>(null);
  const startRef = useRef<number|null>(null);
  const heights = useRef(Array.from({length:32},()=>8+Math.random()*28)).current;
  const planData = PLANS[plan];

  useEffect(()=>{
    store.get<string>(KEYS.DEFAULT_FROM).then(c=>{if(c){const l=LANGS.find(x=>x.code===c);if(l)setFromLang(l);}});
    store.get<string>(KEYS.DEFAULT_TO  ).then(c=>{if(c){const l=LANGS.find(x=>x.code===c);if(l)setToLang(l);}});
  },[]);

  const availableCodes = planData.limits.languages==="all" ? undefined : planData.limits.languages as string[];

  const saveCall = useCallback(async (ms:number)=>{
    const s=Math.floor(ms/1000);
    const entry:CallEntry={participant:userName||"Guest",fromLang:fromLang.name,toLang:toLang.name,
      duration:`${Math.floor(s/60)}:${(s%60).toString().padStart(2,"0")}`,timestamp:Date.now()};
    const h=await store.get<CallEntry[]>(KEYS.CALL_HISTORY)||[];
    h.push(entry); await store.set(KEYS.CALL_HISTORY,h);
  },[fromLang,toLang,userName]);

  const toggle = async () => {
    if (!active) {
      const { allowed, reason } = await canStartSession(plan);
      if (!allowed) { setGateMsg(reason||"Limit reached"); return; }
      await recordSession();
      startRef.current=Date.now(); setActive(true); setGateMsg("");
    } else {
      if(startRef.current) saveCall(Date.now()-startRef.current);
      setActive(false); startRef.current=null;
    }
  };

  useEffect(()=>{
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(!SR) return;
    if(active){
      const r=new SR(); r.continuous=true; r.interimResults=false;
      r.lang=LANG_MAP[fromLang.code]||"en-US";
      r.onresult=async(e:any)=>{
        const t0=Date.now();
        const text=e.results[e.results.length-1][0].transcript;
        setTranslating(true);
        const trans=await translateText(text,fromLang.name,toLang.name);
        setTranslating(false); setLatency(Date.now()-t0);
        setTranscript(p=>[...p,{orig:text,trans}]);
      };
      r.onerror=(e:any)=>{if(e.error==="not-allowed")alert("Microphone permission denied.");};
      r.start(); recRef.current=r;
    } else recRef.current?.stop();
    return()=>recRef.current?.stop();
  },[active,fromLang,toLang]);

  useEffect(()=>{
    if(!active){setDuration(0);return;}
    const iv=setInterval(()=>setDuration(d=>d+1),1000);
    return()=>clearInterval(iv);
  },[active]);

  const swap=()=>{const t=fromLang;setFromLang(toLang);setToLang(t);};
  const fmt=(s:number)=>`${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  return (
    <div className="h-full flex flex-col pb-[70px] relative">
      <AnimatePresence>
        {picker==="from"&&<LangPicker title="Source Language" selected={fromLang} onPick={setFromLang} onClose={()=>setPicker(null)} availableCodes={availableCodes}/>}
        {picker==="to"  &&<LangPicker title="Target Language"  selected={toLang}   onPick={setToLang}   onClose={()=>setPicker(null)} availableCodes={availableCodes}/>}
      </AnimatePresence>

      {/* Header */}
      <div className="px-5 pt-3 pb-1 flex items-center justify-between">
        <div>
          <div className="text-[15px] font-black text-white">Call Interpreter</div>
          <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">snxwfairies innovations</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setShowOrig(v=>!v)}
            className={`p-1.5 rounded-lg border cursor-pointer transition-all ${showOrig?"bg-blue-600/20 border-blue-500/30":"bg-white/5 border-white/10"}`}>
            <MessageSquare size={12} color={showOrig?"#3b82f6":"rgba(255,255,255,0.3)"}/>
          </button>
          {active&&<>
            <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-lg px-2 py-1">
              <Mic size={10} className="text-green-500 pulse-dot"/><span className="text-[8px] font-black text-green-500">MIC</span>
            </div>
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg px-2 py-1">
              <span className="text-[9px] font-black text-blue-500 font-mono">{fmt(duration)}</span>
            </div>
            <div className="flex items-center gap-1 bg-pink-600/10 border border-pink-500/20 rounded-lg px-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-500 pulse-dot"/>
              <span className="text-[8px] font-black text-pink-500">LIVE</span>
            </div>
          </>}
        </div>
      </div>

      {/* Gate banner */}
      {gateMsg && <GateBanner msg={gateMsg} onUpgrade={()=>onNav("plans")}/>}

      {/* Language pair */}
      <div className="px-4 flex items-center gap-2 mb-3">
        {([["from",fromLang,"border-blue-500/40"],["to",toLang,"border-pink-500/30"]] as const).map(([w,l,b])=>(
          <div key={w} onClick={()=>setPicker(w as any)}
            className={`flex-1 bg-white/5 border ${b} rounded-2xl p-2 text-center cursor-pointer`}>
            <div className="text-2xl">{l.flag}</div>
            <div className="text-[11px] font-black text-white mt-0.5">{l.name}</div>
            <div className="text-[9px] text-zinc-500 font-bold">{l.script}</div>
            {l.indian && <div className="text-[7px] text-teal-500 font-black mt-0.5 uppercase">Sarvam.ai</div>}
          </div>
        ))}
        <button onClick={swap} className="w-9 h-9 rounded-full bg-pink-600/10 border border-pink-500/30 flex items-center justify-center text-pink-500 cursor-pointer flex-shrink-0">
          <ArrowLeftRight size={16}/>
        </button>
      </div>

      {/* Waveform */}
      <div className="px-4 mb-3">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3">
          <div className="flex items-center gap-0.5 h-10">
            {heights.map((h,i)=><WaveBar key={i} active={active} height={h} delay={i*28}/>)}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
              {active?(translating?"Translating…":"Interpreting…"):"Ready"}
            </span>
            {latency&&<span className="text-[9px] text-green-500 font-black flex items-center gap-1"><Zap size={9}/>  {latency}ms</span>}
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.2em]">Transcript</span>
          {transcript.length>0&&<button onClick={()=>setTranscript([])} className="text-[8px] font-black text-red-500/60 uppercase tracking-widest bg-transparent border-none cursor-pointer">Clear</button>}
        </div>
        {transcript.length===0&&!active&&(
          <div className="flex flex-col items-center justify-center py-16 opacity-15">
            <div className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center mb-4"><Headphones size={32} strokeWidth={1}/></div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Awaiting Input</div>
          </div>
        )}
        {transcript.map((t,i)=>(
          <motion.div key={i} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <span className="text-[8px] font-black text-zinc-600 uppercase">{fromLang.name}</span>
              <ChevronRight size={8} className="text-zinc-800"/>
              <span className="text-[8px] font-black text-blue-500 uppercase">{toLang.name}</span>
            </div>
            <div className="bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.06] rounded-[22px] p-4">
              <div className="text-[14px] font-black leading-[1.3] text-white tracking-tight mb-1">{t.trans}</div>
              {showOrig&&<div className="pt-2.5 mt-2.5 border-t border-white/5"><div className="text-[11px] text-zinc-500 font-medium italic leading-relaxed">"{t.orig}"</div></div>}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="px-4 mt-2">
        <button onClick={toggle}
          className={`w-full py-3.5 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all border-none cursor-pointer shadow-lg ${active?"bg-gradient-to-r from-red-600 to-red-800":"bg-gradient-to-r from-pink-600 to-purple-700"}`}>
          {active?<Square size={15}/>:<Headphones size={15}/>}
          {active?"Stop Interpreter":"Start Interpreter"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TV SCREEN
// ═══════════════════════════════════════════════════════════
function TVScreen() {
  const [capturing,setCapturing]=useState(false);
  const [captions,setCaptions]=useState<{en:string;hi:string}[]>([]);
  const [fromLang,setFromLang]=useState(LANGS[3]);
  const [toLang,setToLang]=useState(LANGS[0]);
  const [picker,setPicker]=useState<"from"|"to"|null>(null);
  const recRef=useRef<any>(null);
  useEffect(()=>{
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(!SR||!capturing){recRef.current?.stop();return;}
    const r=new SR(); r.continuous=true; r.interimResults=false;
    r.lang=LANG_MAP[fromLang.code]||"en-US";
    r.onresult=async(e:any)=>{
      const text=e.results[e.results.length-1][0].transcript;
      const trans=await translateText(text,fromLang.name,toLang.name);
      setCaptions(p=>[{en:text,hi:trans},...p].slice(0,10));
    };
    r.start(); recRef.current=r;
    return()=>recRef.current?.stop();
  },[capturing,fromLang,toLang]);
  const swap=()=>{const t=fromLang;setFromLang(toLang);setToLang(t);};
  return (
    <div className="h-full flex flex-col pb-[70px] relative">
      <AnimatePresence>
        {picker==="from"&&<LangPicker title="Source Language" selected={fromLang} onPick={setFromLang} onClose={()=>setPicker(null)}/>}
        {picker==="to"  &&<LangPicker title="Target Language"  selected={toLang}   onPick={setToLang}   onClose={()=>setPicker(null)}/>}
      </AnimatePresence>
      <div className="px-5 pt-3 pb-2">
        <div className="text-[15px] font-black text-white">TV & Streaming</div>
        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Interpret any app's audio</div>
      </div>
      <div className="px-4 flex items-center gap-2 mb-3">
        <div onClick={()=>setPicker("from")} className="flex-1 bg-white/5 border border-blue-500/40 rounded-2xl p-2 text-center cursor-pointer">
          <div className="text-2xl">{fromLang.flag}</div><div className="text-[11px] font-black text-white mt-0.5">{fromLang.name}</div>
        </div>
        <button onClick={swap} className="w-9 h-9 rounded-full bg-pink-600/10 border border-pink-500/30 flex items-center justify-center text-pink-500 cursor-pointer flex-shrink-0"><ArrowLeftRight size={16}/></button>
        <div onClick={()=>setPicker("to")} className="flex-1 bg-white/5 border border-pink-500/30 rounded-2xl p-2 text-center cursor-pointer">
          <div className="text-2xl">{toLang.flag}</div><div className="text-[11px] font-black text-white mt-0.5">{toLang.name}</div>
        </div>
      </div>
      <div className="mx-4 mb-3 rounded-2xl overflow-hidden border border-white/10">
        <div className="h-[90px] bg-gradient-to-br from-indigo-900 to-purple-950 flex flex-col items-center justify-center gap-2 relative">
          <Tv size={28} className="text-white/70"/>
          <div className="text-[8px] text-white/30 font-black tracking-[0.18em] uppercase">Any App · Netflix · Prime · YouTube</div>
          {capturing&&<div className="absolute top-2 right-2 bg-pink-600/15 border border-pink-500/40 rounded-lg px-2 py-1 flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-pink-500 pulse-dot"/><span className="text-[7px] font-black text-pink-500 uppercase tracking-widest">CAPTURING</span></div>}
        </div>
        <div className="p-3 bg-white/[0.03]">
          <div className="text-[11px] font-black text-white">Floating Bubble Active</div>
          <div className="text-[9px] text-zinc-500 font-bold mt-0.5 uppercase tracking-widest">{fromLang.name} → {toLang.name} · Live subtitles</div>
        </div>
      </div>
      <div className="no-scrollbar px-4 flex-1 overflow-y-auto">
        {captions.length===0&&!capturing&&<div className="text-center py-8 text-zinc-700 text-[10px] font-bold uppercase tracking-widest">Tap Start to interpret TV audio</div>}
        {captions.map((c,i)=>(
          <motion.div key={i} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} className="mb-2.5 bg-blue-600/10 border border-blue-500/20 rounded-2xl p-3">
            <div className="text-[9px] text-zinc-500 font-bold mb-1 uppercase tracking-widest">🔊 {c.en}</div>
            <div className="text-[12px] text-white font-black">🇮🇳 {c.hi}</div>
          </motion.div>
        ))}
      </div>
      <div className="px-4 mt-2 flex gap-2">
        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center">
          <div className="text-lg mb-0.5">{fromLang.flag}→{toLang.flag}</div>
          <div className="text-[8px] text-zinc-500 font-black tracking-widest uppercase">{fromLang.code.toUpperCase()} → {toLang.code.toUpperCase()}</div>
        </div>
        <button onClick={()=>setCapturing(v=>!v)} className={`flex-[2] py-2.5 rounded-2xl font-black text-xs text-white transition-all border-none cursor-pointer shadow-lg ${capturing?"bg-gradient-to-r from-red-600 to-red-800":"bg-gradient-to-r from-emerald-600 to-teal-800"}`}>
          {capturing?"STOP CAPTURE":"START CAPTURE"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ROOM SCREEN
// ═══════════════════════════════════════════════════════════
function RoomScreen({ plan, onNav }:{ plan:PlanId; onNav:(s:string)=>void }) {
  const [joined,setJoined]=useState(false);
  const [userName,setUserName]=useState("");
  const [myLang,setMyLang]=useState(LANGS[0]);
  const [micOn,setMicOn]=useState(true);
  const [isSpeaking,setIsSpeaking]=useState(false);
  const [messages,setMessages]=useState<any[]>([]);
  const [participants,setParticipants]=useState<any[]>([]);
  const [serverUrl,setServerUrl]=useState("");
  const wsRef=useRef<WebSocket|null>(null);
  const recRef=useRef<any>(null);
  const userId=useRef(`u-${Math.random().toString(36).slice(2,8)}`).current;
  const maxP=maxParticipants(plan);
  const hasAccess=canUseFeature(plan,"rooms");

  useEffect(()=>{
    store.get<string>(KEYS.USER_NAME).then(n=>{if(n)setUserName(n);});
    store.get<string>(KEYS.ROOM_SERVER_URL).then(u=>{if(u)setServerUrl(u);});
  },[]);

  useEffect(()=>{
    if(!joined||!serverUrl)return;
    const ws=new WebSocket(serverUrl);
    wsRef.current=ws;
    ws.onopen=()=>ws.send(JSON.stringify({type:"join",roomId:"SNX-2024",userId,name:userName,lang:myLang.name,micOn}));
    ws.onmessage=async(e)=>{
      const d=JSON.parse(e.data);
      if(d.type==="room_state")          setParticipants(d.members);
      else if(d.type==="user_joined")    setParticipants(p=>[...p,d.user]);
      else if(d.type==="user_left")      setParticipants(p=>p.filter((x:any)=>x.id!==d.userId));
      else if(d.type==="mic_status")     setParticipants(p=>p.map((x:any)=>x.id===d.userId?{...x,micOn:d.micOn}:x));
      else if(d.type==="speaking_status")setParticipants(p=>p.map((x:any)=>x.id===d.userId?{...x,speaking:d.speaking}:x));
      else if(d.type==="speech"){
        const translated=await translateText(d.text,d.sourceLang,myLang.name);
        setMessages(p=>[...p,{userId:d.userId,userName:d.userName,text:d.text,translated,timestamp:d.timestamp}].slice(-20));
      }
    };
    ws.onerror=()=>alert("Cannot connect to room server.");
    return()=>ws.close();
  },[joined,myLang,serverUrl]);

  if(!hasAccess) return (
    <div className="h-full flex flex-col pb-[70px] items-center justify-center px-8 gap-5">
      <Crown size={48} color="#fbbf24" strokeWidth={1.5}/>
      <div className="text-center">
        <div className="text-[15px] font-black text-white mb-2">Rooms need Pro or above</div>
        <div className="text-[11px] text-zinc-500 leading-relaxed">Multi-user interpretation rooms are available on Pro, Business, and Enterprise plans.</div>
      </div>
      <button onClick={()=>onNav("plans")} className="bg-gradient-to-r from-pink-600 to-purple-700 text-white font-black text-xs px-6 py-3 rounded-2xl border-none cursor-pointer uppercase tracking-widest">View Plans</button>
    </div>
  );

  const toggleMic=()=>{const n=!micOn;setMicOn(n);wsRef.current?.readyState===WebSocket.OPEN&&wsRef.current.send(JSON.stringify({type:"mic_status",micOn:n}));};
  const startSpeaking=()=>{
    if(!micOn)return;
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(!SR)return;
    setIsSpeaking(true);
    const r=new SR(); r.lang=LANG_MAP[myLang.code]||"en-US";
    r.onresult=(e:any)=>{
      const text=e.results[0][0].transcript;
      wsRef.current?.readyState===WebSocket.OPEN&&wsRef.current.send(JSON.stringify({type:"speech",text,lang:myLang.name}));
      setMessages(p=>[...p,{userId,userName:"You",text,translated:text,timestamp:Date.now()}].slice(-20));
    };
    r.onend=()=>{setIsSpeaking(false);wsRef.current?.readyState===WebSocket.OPEN&&wsRef.current.send(JSON.stringify({type:"speaking_status",speaking:false}));};
    r.start(); recRef.current=r;
    wsRef.current?.readyState===WebSocket.OPEN&&wsRef.current.send(JSON.stringify({type:"speaking_status",speaking:true}));
  };

  const handleJoin=async()=>{if(!userName.trim())return;await store.set(KEYS.USER_NAME,userName.trim());setJoined(true);};

  return (
    <div className="h-full flex flex-col pb-[70px]">
      <div className="px-5 pt-3 pb-1 flex justify-between items-start">
        <div>
          <div className="text-[15px] font-black text-white">Interpretation Room</div>
          <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
            {joined?`${participants.length}/${maxP} participants`:`Max ${maxP} people · ${PLANS[plan].name} plan`}
          </div>
        </div>
        {joined&&<div className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[8px] font-black text-white tracking-[0.2em] uppercase">SNX-2024</div>}
      </div>
      {!joined?(
        <div className="p-4 flex-1 flex flex-col gap-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Your name</div>
            <input type="text" value={userName} onChange={e=>setUserName(e.target.value)} placeholder="e.g. Prashant"
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none mb-4"/>
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Your language</div>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {LANGS.slice(0,4).map(l=>(
                <button key={l.code} onClick={()=>setMyLang(l)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${myLang.code===l.code?"bg-blue-600/20 border-blue-500/50":"bg-white/5 border-white/5"}`}>
                  <div className="text-xl mb-1">{l.flag}</div><div className="text-[10px] font-black text-white">{l.name}</div>
                </button>
              ))}
            </div>
            {!serverUrl&&<div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 flex gap-2 items-center">
              <AlertTriangle size={14} color="#fbbf24"/><div className="text-[10px] text-amber-300 font-bold">Room server not configured. Ask admin to set server URL in Admin Panel.</div>
            </div>}
            <button onClick={handleJoin} disabled={!userName.trim()||!serverUrl}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black text-xs tracking-widest uppercase border-none cursor-pointer disabled:opacity-40 shadow-lg">
              JOIN ROOM
            </button>
          </div>
        </div>
      ):(
        <>
          <div className="no-scrollbar px-4 py-2 flex gap-2 overflow-x-auto">
            {participants.map((p:any)=>(
              <div key={p.id} className="flex-shrink-0 flex flex-col items-center gap-1.5">
                <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center text-base relative transition-all font-black text-white bg-white/10 ${p.speaking?"border-green-500 shadow-[0_0_14px_rgba(34,197,94,0.35)] scale-105":"border-white/10"}`}>
                  {p.name?.[0]||"?"}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#060B18] flex items-center justify-center ${p.micOn?"bg-green-500":"bg-red-500"}`}>
                    {p.micOn?<Mic size={8} color="white"/>:<MicOff size={8} color="white"/>}
                  </div>
                </div>
                <div className="text-[7px] font-black text-zinc-500 uppercase truncate w-12 text-center">{p.id===userId?"You":p.name}</div>
              </div>
            ))}
          </div>
          <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3">
            {messages.length===0&&<div className="flex flex-col items-center justify-center py-16 opacity-15"><MessageSquare size={40} strokeWidth={1}/><div className="text-[9px] font-black uppercase mt-4 tracking-widest">No messages yet</div></div>}
            {messages.map((m:any,i:number)=>(
              <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className={`flex flex-col ${m.userId===userId?"items-end":"items-start"}`}>
                <div className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1 px-2">{m.userName} · {new Date(m.timestamp).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
                <div className={`max-w-[85%] rounded-2xl p-3 border ${m.userId===userId?"bg-blue-600/10 border-blue-500/20":"bg-white/5 border-white/10"}`}>
                  <div className="text-[10px] text-zinc-500 font-medium italic mb-1">"{m.text}"</div>
                  <div className="text-[12px] text-white font-black leading-tight">{m.translated}</div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="p-4 bg-black/40 border-t border-white/5 flex gap-3">
            <button onClick={toggleMic} className={`w-12 h-12 rounded-2xl border flex items-center justify-center cursor-pointer transition-all ${micOn?"bg-green-500/10 border-green-500/30 text-green-500":"bg-red-500/10 border-red-500/30 text-red-500"}`}>
              {micOn?<Mic size={20}/>:<MicOff size={20}/>}
            </button>
            <button onClick={startSpeaking} disabled={!micOn} className={`flex-1 rounded-2xl font-black text-xs tracking-widest uppercase transition-all border-none cursor-pointer disabled:opacity-40 ${isSpeaking?"bg-red-600 text-white":"bg-blue-600 text-white"}`}>
              {isSpeaking?"LISTENING…":"TAP TO SPEAK"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PLANS SCREEN
// ═══════════════════════════════════════════════════════════
function PlansScreen({ currentPlan, onPlanChange }:{ currentPlan:PlanId; onPlanChange:(p:PlanId)=>void }) {
  const [buying,setBuying]=useState<PlanId|null>(null);
  const [restoring,setRestoring]=useState(false);
  const [msg,setMsg]=useState("");

  const buy=async(planId:PlanId)=>{
    if(planId==="free"){setMsg("Free plan is already active.");return;}
    setBuying(planId);
    const {success,error}=await purchasePlan(planId);
    setBuying(null);
    if(success){onPlanChange(planId);setMsg(`✅ ${PLANS[planId].name} activated!`);}
    else setMsg(error||"Purchase failed");
    setTimeout(()=>setMsg(""),4000);
  };
  const restore=async()=>{setRestoring(true);const p=await restorePurchases();onPlanChange(p);setRestoring(false);setMsg(`✅ Restored: ${PLANS[p].name}`);setTimeout(()=>setMsg(""),3000);};

  return (
    <div className="h-full flex flex-col pb-[70px]">
      <div className="px-5 pt-3 pb-2">
        <div className="text-[15px] font-black text-white">Subscription Plans</div>
        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Powered by Google Play Billing</div>
      </div>
      {msg&&<div className={`mx-4 mb-2 p-3 rounded-xl border text-[11px] font-bold flex items-center gap-2 ${msg.startsWith("✅")?"bg-green-500/10 border-green-500/20 text-green-400":"bg-red-500/10 border-red-500/20 text-red-400"}`}><CheckCircle size={14}/>{msg}</div>}
      <div className="no-scrollbar px-3.5 flex-1 overflow-y-auto flex flex-col gap-2">
        {(Object.values(PLANS) as typeof PLANS[PlanId][]).map(p=>{
          const isActive=currentPlan===p.id;
          return (
            <div key={p.id} className={`border rounded-2xl p-3.5 transition-all ${isActive?"bg-blue-500/10 border-blue-500/50":"bg-white/[0.03] border-white/10"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p.icon}</span>
                  <span className="text-[14px] font-black text-white">{p.name}</span>
                  {(p as any).popular&&<span className="text-[7px] font-black bg-pink-600 text-white px-1.5 py-0.5 rounded-full">POPULAR</span>}
                  {isActive&&<span className="text-[7px] font-black bg-green-500/20 border border-green-500/30 text-green-400 px-1.5 py-0.5 rounded-full">ACTIVE</span>}
                </div>
                <div className="text-right"><span className="text-[17px] font-black text-white">{p.priceStr}</span><span className="text-[9px] text-zinc-500 font-bold">{p.period}</span></div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {p.features.map((f:string,i:number)=><span key={i} className="text-[7px] text-zinc-400 font-bold bg-white/5 px-2 py-1 rounded-lg uppercase tracking-widest">✓ {f}</span>)}
              </div>
              {!isActive&&(
                <button onClick={()=>buy(p.id as PlanId)} disabled={!!buying}
                  className={`w-full py-2.5 rounded-xl font-black text-xs text-white border-none cursor-pointer transition-all disabled:opacity-50 ${p.id==="free"?"bg-white/10":"bg-gradient-to-r from-blue-600 to-indigo-700"}`}>
                  {buying===p.id?<span className="flex items-center justify-center gap-2"><Loader2 size={14} className="spin"/> Processing…</span>:p.id==="free"?"Downgrade to Free":`Subscribe · ${p.priceStr}/mo`}
                </button>
              )}
            </div>
          );
        })}
        <button onClick={restore} disabled={restoring} className="flex items-center justify-center gap-2 py-3 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-none bg-transparent cursor-pointer">
          <RefreshCw size={12} className={restoring?"spin":""}/> Restore Purchases
        </button>
        <div className="text-center text-[8px] text-zinc-600 font-bold uppercase tracking-widest pb-4">
          Subscriptions auto-renew monthly · Cancel anytime in Play Store · Secured by Google Pay
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════
function HistoryScreen({ plan, onNav }:{ plan:PlanId; onNav:(s:string)=>void }) {
  const [history,setHistory]=useState<CallEntry[]|null>(null);
  useEffect(()=>{store.get<CallEntry[]>(KEYS.CALL_HISTORY).then(h=>setHistory(h?[...h].reverse():[]));},[]);
  const clear=async()=>{await store.del(KEYS.CALL_HISTORY);setHistory([]);};
  if(!canUseFeature(plan,"history")) return (
    <div className="h-full flex flex-col pb-[70px] items-center justify-center px-8 gap-4">
      <History size={40} strokeWidth={1} color="#fbbf24"/>
      <div className="text-center"><div className="text-[14px] font-black text-white mb-2">History needs Starter+</div><div className="text-[11px] text-zinc-500 leading-relaxed">Call history is available on Starter, Pro, Business and Enterprise plans.</div></div>
      <button onClick={()=>onNav("plans")} className="bg-gradient-to-r from-pink-600 to-purple-700 text-white font-black text-xs px-6 py-3 rounded-2xl border-none cursor-pointer uppercase tracking-widest">View Plans</button>
    </div>
  );
  return (
    <div className="h-full flex flex-col pb-[70px]">
      <div className="px-5 pt-3 pb-2 flex justify-between items-center">
        <div><div className="text-[15px] font-black text-white">Call History</div><div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Recent sessions</div></div>
        <div className="flex gap-3">
          <button onClick={clear} className="text-[9px] text-red-500 font-black uppercase bg-transparent border-none cursor-pointer">Clear</button>
          <button onClick={()=>onNav("settings")} className="text-[9px] text-blue-500 font-black uppercase bg-transparent border-none cursor-pointer">← Back</button>
        </div>
      </div>
      <div className="no-scrollbar px-4 flex-1 overflow-y-auto flex flex-col gap-2.5">
        {history===null&&<div className="flex justify-center pt-16 opacity-20"><Loader2 size={24} className="spin"/></div>}
        {history?.length===0&&<div className="flex flex-col items-center justify-center py-20 opacity-15"><History size={40} strokeWidth={1}/><div className="text-[9px] font-black uppercase mt-4 tracking-widest">No history yet</div></div>}
        {history?.map((h,i)=>(
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-xs">👤</div>
                <div>
                  <div className="text-xs font-black text-white">{h.participant}</div>
                  <div className="text-[7px] text-zinc-500 font-bold uppercase tracking-widest">{new Date(h.timestamp).toLocaleDateString()} · {new Date(h.timestamp).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
                </div>
              </div>
              <span className="text-[10px] text-blue-500 font-black font-mono">{h.duration}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/20 rounded-xl p-2 border border-white/5">
              <div className="flex-1 text-center text-[10px] font-black text-white">{h.fromLang}</div>
              <ArrowLeftRight size={10} className="text-zinc-600"/>
              <div className="flex-1 text-center text-[10px] font-black text-white">{h.toLang}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════
function AnalyticsScreen({ plan, onNav }:{ plan:PlanId; onNav:(s:string)=>void }) {
  const bars=[40,65,50,80,72,90,100]; const days=["M","T","W","T","F","S","S"];
  if(!canUseFeature(plan,"analytics")) return (
    <div className="h-full flex flex-col pb-[70px] items-center justify-center px-8 gap-4">
      <BarChart3 size={40} strokeWidth={1} color="#fbbf24"/>
      <div className="text-center"><div className="text-[14px] font-black text-white mb-2">Analytics needs Pro+</div><div className="text-[11px] text-zinc-500 leading-relaxed">Usage analytics are available on Pro, Business, and Enterprise plans.</div></div>
      <button onClick={()=>onNav("plans")} className="bg-gradient-to-r from-pink-600 to-purple-700 text-white font-black text-xs px-6 py-3 rounded-2xl border-none cursor-pointer uppercase tracking-widest">View Plans</button>
    </div>
  );
  const stats=[{label:"Sessions",value:"247",delta:"+12%",color:"#60a5fa"},{label:"Minutes",value:"891",delta:"+8%",color:"#2dd4bf"},{label:"Avg Latency",value:"1.4s",delta:"Excellent",color:"#4ade80"},{label:"API Cost",value:"₹198",delta:"This week",color:"#fbbf24"}];
  return (
    <div className="h-full flex flex-col pb-[70px]">
      <div className="px-5 pt-3 pb-2 flex justify-between items-center">
        <div><div className="text-[15px] font-black text-white">Analytics</div><div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Past 7 days</div></div>
        <button onClick={()=>onNav("settings")} className="text-[10px] text-blue-500 font-black uppercase bg-transparent border-none cursor-pointer">← Back</button>
      </div>
      <div className="no-scrollbar px-4 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {stats.map((s,i)=>(
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-3">
              <div className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mb-1">{s.label}</div>
              <div className="text-xl font-black text-white font-mono">{s.value}</div>
              <div className="text-[8px] font-black uppercase tracking-widest mt-1" style={{color:s.color}}>{s.delta}</div>
            </div>
          ))}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3">
          <div className="text-[10px] font-black text-white mb-3 uppercase tracking-widest">Daily Sessions</div>
          <div className="flex items-end gap-1.5 h-[60px]">
            {bars.map((h,i)=>(
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full rounded-t-sm bar-grow ${i===6?"bg-pink-600":"bg-blue-600"} opacity-80`} style={{height:`${h}%`,animationDelay:`${i*0.05}s`}}/>
                <div className="text-[7px] text-zinc-600 font-bold">{days[i]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="text-[10px] font-black text-white mb-3 uppercase tracking-widest">Top Language Pairs</div>
          {[["Hindi ↔ Telugu","42%","Sarvam.ai"],["Hindi ↔ Tamil","28%","Sarvam.ai"],["Hindi ↔ English","18%","Sarvam.ai"],["Arabic ↔ English","7%","Claude"],["French ↔ English","5%","Claude"]].map(([pair,pct,engine],i)=>(
            <div key={i} className="mb-2.5 last:mb-0">
              <div className="flex justify-between mb-1">
                <div className="flex items-center gap-2"><span className="text-[10px] text-zinc-400 font-bold">{pair}</span><span className="text-[7px] font-black px-1.5 py-0.5 rounded-full bg-white/5 text-zinc-500 uppercase">{engine}</span></div>
                <span className="text-[10px] text-blue-500 font-black">{pct}</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full prog-fill" style={{width:pct,animationDelay:`${i*0.12}s`}}/></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SUPPORT
// ═══════════════════════════════════════════════════════════
function SupportScreen({ onNav }:{ onNav:(s:string)=>void }) {
  const [messages,setMessages]=useState([{bot:true,text:"Hello! 👋 I'm your Live Interpreter support assistant. How can I help?",qr:["App not working","Payment issue","How to use?","Talk to human"]}]);
  const [input,setInput]=useState(""); const [typing,setTyping]=useState(false);
  const endRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[messages,typing]);
  const respond=(msg:string)=>{
    setMessages(p=>[...p,{bot:false,text:msg,qr:[]}]);
    setTyping(true);
    setTimeout(()=>{
      setTyping(false);
      const r:any=({
        "App not working":{text:"Try:\n1. Close & reopen the app\n2. Check internet connection\n3. Re-enter API key in Settings\n4. Contact support if issue persists",qr:["Still broken","Fixed!"]},
        "Payment issue":{text:"Subscriptions are processed through Google Play. For refunds, go to play.google.com/store/account.\n\nOr email: billing@snxwfairies.com",qr:["Need refund","Talk to human"]},
        "How to use?":{text:"1. Go to 📞 Call tab\n2. Tap languages to select source & target\n3. Put on headphones\n4. Tap 'Start Interpreter'\n5. Speak naturally!",qr:["What's Sarvam.ai?","Tell me more","Thanks!"]},
        "What's Sarvam.ai?":{text:"Sarvam.ai is an Indian AI company specialized in Indian language translation. This app uses their Mayura model for superior accuracy in Hindi, Telugu, Tamil, Marathi, Kannada, Malayalam, Gujarati, and Bengali.",qr:["Thanks!"]},
        "Talk to human":{text:"✅ Connecting to support…\n\nTicket: TKT-"+Math.random().toString(36).slice(2,8).toUpperCase()+"\n\nExpected response: within 24 hours.\n\nEmail: support@snxwfairies.com",qr:[]},
      })[msg]||{text:"Please email support@snxwfairies.com — we reply within 24 hours.",qr:["Talk to human"]};
      setMessages(p=>[...p,{bot:true,...r}]);
    },1200);
  };
  return (
    <div className="h-full flex flex-col pb-[70px]">
      <div className="px-4 pt-3 pb-2 flex items-center gap-3 border-b border-white/5">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-lg">🤖</div>
        <div className="flex-1"><div className="text-[12px] font-black text-white">Live Support</div><div className="text-[8px] text-green-500 font-black uppercase tracking-widest">🟢 AI Assistant</div></div>
        <button onClick={()=>onNav("settings")} className="text-[10px] text-blue-500 font-black uppercase bg-transparent border-none cursor-pointer">← Back</button>
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto px-3.5 py-3 flex flex-col gap-2.5">
        {messages.map((m,i)=>(
          <div key={i} className={`flex flex-col ${m.bot?"items-start":"items-end"} gap-1.5`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] leading-relaxed font-medium whitespace-pre-line ${m.bot?"bg-white/5 border border-white/10 text-zinc-300":"bg-blue-600/20 border border-blue-500/30 text-blue-100"}`}>{m.text}</div>
            {m.qr?.length>0&&<div className="flex flex-wrap gap-1.5">{m.qr.map((q:string,j:number)=><button key={j} onClick={()=>respond(q)} className="text-[8px] font-black px-2.5 py-1.5 rounded-xl border border-blue-500/30 text-blue-400 bg-blue-500/5 uppercase tracking-widest cursor-pointer">{q}</button>)}</div>}
          </div>
        ))}
        {typing&&<div className="flex gap-1 p-2.5 bg-white/5 rounded-xl w-14">{[0,1,2].map(i=><div key={i} className="pulse-dot w-1.5 h-1.5 rounded-full bg-zinc-600" style={{animationDelay:`${i*0.2}s`}}/>)}</div>}
        <div ref={endRef}/>
      </div>
      <div className="px-3.5 pt-2 flex gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&input.trim()){respond(input.trim());setInput("");}}} placeholder="Type your question…" className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-white text-[11px] outline-none font-medium"/>
        <button onClick={()=>{if(input.trim()){respond(input.trim());setInput("");}}} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white border-none cursor-pointer flex-shrink-0"><ChevronRight size={20}/></button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════
function SettingsScreen({ onNav, plan, userName, logoTaps, onLogoTap }:{
  onNav:(s:string)=>void; plan:PlanId; userName:string; logoTaps:number; onLogoTap:()=>void;
}) {
  const engine = engineStatus();
  const planData = PLANS[plan];
  const items=[
    {icon:<BarChart3 size={18}/>,label:"Analytics",         sub:"Sessions & language stats",    screen:"analytics"},
    {icon:<History size={18}/>,  label:"Call History",      sub:"Past sessions",                 screen:"history"},
    {icon:<Globe size={18}/>,    label:"Language Prefs",    sub:"Set default language pair",     screen:"lang_prefs"},
    {icon:<HelpCircle size={18}/>,label:"Support Chat",     sub:"AI + Human support",            screen:"support"},
    {icon:<Star size={18}/>,     label:"Subscription",      sub:"Manage your plan",              screen:"plans"},
    {icon:<Cloud size={18}/>,    label:"Backup & Restore",  sub:"Cloud + local backup"},
    {icon:<Lock size={18}/>,     label:"Enterprise SSO",    sub:"Google · Microsoft · Team Code"},
    {icon:<Shield size={18}/>,   label:"Privacy & Security",sub:"Data protection settings"},
    {icon:<Info size={18}/>,     label:"About",             sub:"snxwfairies innovations pvt. ltd"},
  ];
  return (
    <div className="h-full flex flex-col pb-[70px]">
      <div className="px-4 pt-3 pb-3">
        {/* Profile + logo tap target */}
        <div className="bg-gradient-to-br from-blue-600/10 to-pink-600/10 border border-white/10 rounded-2xl p-4 flex gap-3.5 items-center">
          <button onClick={onLogoTap} className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-pink-600 flex items-center justify-center text-xl font-black text-white flex-shrink-0 border-none cursor-pointer relative">
            {(userName||"P")[0].toUpperCase()}
            {logoTaps>0&&logoTaps<7&&<div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-600 flex items-center justify-center text-[8px] font-black text-white">{7-logoTaps}</div>}
          </button>
          <div className="flex-1">
            <div className="text-sm font-black text-white">{userName||"Prashant"}</div>
            <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">snxwfairies innovations</div>
            <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-full border" style={{background:`${planData.color}`,borderColor:"rgba(255,255,255,0.12)"}}>
              <span className="text-[8px] font-black text-white tracking-widest uppercase">{planData.icon} {planData.name} Plan</span>
            </div>
          </div>
        </div>
        {logoTaps>0&&logoTaps<7&&<div className="text-center text-[8px] text-pink-500/60 font-black uppercase tracking-widest mt-2">Tap {7-logoTaps} more times for admin access</div>}
      </div>

      {/* Engine status */}
      <div className="mx-4 mb-2 bg-white/[0.03] border border-white/5 rounded-xl p-3 flex items-center justify-between">
        <div className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Translation Engine</div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{background:engine.color}}/>
          <span className="text-[9px] font-black text-white">{engine.label}</span>
          {engine.dual&&<span className="text-[7px] bg-teal-500/15 border border-teal-500/25 text-teal-400 px-1.5 py-0.5 rounded-full font-black uppercase">OPTIMAL</span>}
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 flex flex-col gap-1.5">
        {items.map((item,i)=>(
          <button key={i} onClick={()=>item.screen&&onNav(item.screen)}
            className="flex items-center gap-3.5 p-3 bg-white/5 border border-white/10 rounded-2xl text-left hover:bg-white/10 transition-colors cursor-pointer w-full border-none">
            <div className="text-zinc-500">{item.icon}</div>
            <div className="flex-1">
              <div className="text-[12px] font-black text-white">{item.label}</div>
              <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">{item.sub}</div>
            </div>
            {item.screen&&<ChevronRight size={13} className="text-zinc-700"/>}
          </button>
        ))}
        <div className="text-center py-4 text-[8px] text-zinc-700 font-bold uppercase tracking-widest">
          Live Interpreter v1.0 · snxwfairies.com
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LANG PREFS
// ═══════════════════════════════════════════════════════════
function LangPrefsScreen({ onNav }:{ onNav:(s:string)=>void }) {
  const [from,setFrom]=useState("hi"); const [to,setTo]=useState("en");
  useEffect(()=>{store.get<string>(KEYS.DEFAULT_FROM).then(c=>{if(c)setFrom(c);});store.get<string>(KEYS.DEFAULT_TO).then(c=>{if(c)setTo(c);});},[]);
  const save=async(f:string,t:string)=>{setFrom(f);setTo(t);await store.set(KEYS.DEFAULT_FROM,f);await store.set(KEYS.DEFAULT_TO,t);};
  return (
    <div className="h-full flex flex-col pb-[70px]">
      <div className="px-5 pt-3 pb-2 flex justify-between items-center">
        <div><div className="text-[15px] font-black text-white">Language Prefs</div><div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Default pair for calls</div></div>
        <button onClick={()=>onNav("settings")} className="text-[10px] text-blue-500 font-black uppercase bg-transparent border-none cursor-pointer">← Back</button>
      </div>
      <div className="no-scrollbar px-4 flex-1 overflow-y-auto flex flex-col gap-4">
        {([{label:"Source Language",val:from,set:(c:string)=>save(c,to),color:"#3b82f6"},{label:"Target Language",val:to,set:(c:string)=>save(from,c),color:"#ec4899"}]).map(({label,val,set,color})=>(
          <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">{label}</div>
            <div className="grid grid-cols-2 gap-2">
              {LANGS.map(l=>(
                <button key={l.code} onClick={()=>set(l.code)}
                  className="p-2.5 rounded-xl border text-left cursor-pointer transition-all"
                  style={{background:val===l.code?`${color}22`:"rgba(255,255,255,0.03)",borderColor:val===l.code?color:"rgba(255,255,255,0.06)"}}>
                  <div className="text-lg">{l.flag}</div>
                  <div className="text-[10px] font-black text-white mt-1">{l.name}</div>
                  {l.indian&&<div className="text-[7px] text-teal-500 font-black mt-0.5 uppercase">Sarvam.ai</div>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// BOTTOM NAV
// ═══════════════════════════════════════════════════════════
function BottomNav({ active, onSelect }:{ active:string; onSelect:(id:string)=>void }) {
  const tabs=[{id:"call",Icon:Phone,label:"Call"},{id:"tv",Icon:Tv,label:"TV Live"},{id:"room",Icon:Users,label:"Room"},{id:"settings",Icon:Settings,label:"Settings"}];
  return (
    <div className="fixed bottom-0 left-0 right-0 h-[62px] bg-[#060B18]/98 border-t border-white/5 flex items-center justify-around backdrop-blur-xl z-10" style={{paddingBottom:"env(safe-area-inset-bottom)"}}>
      {tabs.map(({id,Icon,label})=>(
        <button key={id} onClick={()=>onSelect(id)} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all cursor-pointer border-none bg-transparent ${active===id?"bg-blue-600/20":""}`}>
          <Icon size={22} color={active===id?"#3b82f6":"rgba(255,255,255,0.2)"}/>
          <span className={`text-[9px] font-black tracking-wider uppercase ${active===id?"text-blue-500":"text-zinc-700"}`}>{label}</span>
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [screen,setScreen]     = useState("call");
  const [plan,setPlan]         = useState<PlanId>("free");
  const [userName,setUserName] = useState("Prashant");
  const [ready,setReady]       = useState(false);
  const [showAdmin,setShowAdmin] = useState(false);
  const [logoTaps,setLogoTaps]   = useState(0);
  const tapTimerRef = useRef<any>(null);

  useEffect(()=>{
    (async()=>{
      await loadCache();
      const [openrouterKey,sarvamKey,rcKey,name,savedPlan]=await Promise.all([
        store.get<string>(KEYS.OPENROUTER_KEY),
        store.get<string>(KEYS.SARVAM_KEY),
        store.get<string>(KEYS.RC_PUBLIC_KEY),
        store.get<string>(KEYS.USER_NAME),
        store.get<PlanId>(KEYS.USER_PLAN),
      ]);
      if(openrouterKey||sarvamKey) setKeys(openrouterKey||"",sarvamKey||"");
      if(name) setUserName(name);
      if(rcKey) {
        const userId=`user_${Math.random().toString(36).slice(2,10)}`;
        await initRevenueCat(rcKey,userId);
      }
      const currentPlan=await getCurrentPlan();
      setPlan(currentPlan||(savedPlan||"free"));
      setReady(true);
    })();
    navigator.mediaDevices?.getUserMedia({audio:true}).catch(()=>{});
  },[]);

  const handleLogoTap=()=>{
    setLogoTaps(t=>{
      const next=t+1;
      if(tapTimerRef.current) clearTimeout(tapTimerRef.current);
      tapTimerRef.current=setTimeout(()=>setLogoTaps(0),3000);
      if(next>=7){setShowAdmin(true);return 0;}
      return next;
    });
  };

  if(!ready) return (
    <div className="min-h-dvh bg-[#04070f] flex items-center justify-center flex-col gap-4">
      <div className="text-5xl">🧚</div>
      <div className="text-white font-black text-[13px] uppercase tracking-[0.2em]">Live Interpreter</div>
      <Loader2 size={20} className="text-blue-500 spin mt-2"/>
    </div>
  );

  const activeNav=["call","tv","room"].includes(screen)?screen
    :["settings","analytics","support","plans","history","lang_prefs"].includes(screen)?"settings"
    :"settings";

  return (
    <div className="min-h-dvh bg-[#060B18] flex flex-col" style={{maxWidth:430,margin:"0 auto"}}>
      <div style={{height:"env(safe-area-inset-top)",background:"#060B18",flexShrink:0}}/>
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div key={screen} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.14}} className="h-full">
            {screen==="call"       &&<CallScreen      plan={plan} onNav={setScreen} userName={userName}/>}
            {screen==="tv"         &&<TVScreen/>}
            {screen==="room"       &&<RoomScreen       plan={plan} onNav={setScreen}/>}
            {screen==="plans"      &&<PlansScreen      currentPlan={plan} onPlanChange={p=>{setPlan(p);store.set(KEYS.USER_PLAN,p);}}/>}
            {screen==="settings"   &&<SettingsScreen   onNav={setScreen} plan={plan} userName={userName} logoTaps={logoTaps} onLogoTap={handleLogoTap}/>}
            {screen==="analytics"  &&<AnalyticsScreen  plan={plan} onNav={setScreen}/>}
            {screen==="support"    &&<SupportScreen    onNav={setScreen}/>}
            {screen==="history"    &&<HistoryScreen    plan={plan} onNav={setScreen}/>}
            {screen==="lang_prefs" &&<LangPrefsScreen  onNav={setScreen}/>}
          </motion.div>
        </AnimatePresence>
      </div>
      <BottomNav active={activeNav} onSelect={setScreen}/>
      <AnimatePresence>
        {showAdmin&&<AdminPanel onClose={()=>setShowAdmin(false)}/>}
      </AnimatePresence>
    </div>
  );
}
