import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, ChevronRight, ArrowLeftRight, Headphones, Mic, Square, Zap } from "lucide-react";
import { LANGS, LANG_MAP } from "../lib/constants";
import { type PlanId, getPlan, canUseFeature } from "../lib/plans";
import { store, KEYS } from "../lib/storage";
import { translateText } from "../lib/translation";
import { canStartSession, recordSession } from "../lib/subscription";
import { LangPicker } from "../components/LangPicker";
import { GateBanner } from "../components/GateBanner";

type Lang = typeof LANGS[0];
interface CallEntry { participant:string; fromLang:string; toLang:string; duration:string; timestamp:number; }

function WaveBar({ active, height, delay }: { active:boolean; height:number; delay:number }) {
  const dur = useRef(0.4+Math.random()*0.4).current;
  return (
    <div className={active?"wave-bar":""} style={{
      width:3,borderRadius:2,flexShrink:0,transition:"height 0.3s",
      height:active?height:4,
      background:active?"linear-gradient(to top,#1565C0,#42A5F5)":"rgba(255,255,255,0.07)",
      ["--wh" as any]:`${height}px`,["--wd" as any]:`${dur}s`,
      animationDelay:`${delay}ms`,
    }}/>
  );
}

export function CallScreen({ plan, onNav, userName }:{plan:PlanId; onNav:(s:string)=>void; userName:string}) {
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
  const planData = getPlan(plan);

  useEffect(()=>{
    store.get<string>(KEYS.DEFAULT_FROM).then(c=>{if(c){const l=LANGS.find(x=>x.code===c);if(l)setFromLang(l);}});
    store.get<string>(KEYS.DEFAULT_TO  ).then(c=>{if(c){const l=LANGS.find(x=>x.code===c);if(l)setToLang(l);}});
  },[]);

  const availableCodes = planData.languages === -1 ? undefined : LANGS.map(l=>l.code).slice(0,4);

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
      {gateMsg && <GateBanner msg={gateMsg} onUpgrade={()=>onNav("plans")}/>}
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
