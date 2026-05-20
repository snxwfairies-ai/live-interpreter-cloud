import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeftRight, Tv } from "lucide-react";
import { LANGS, LANG_MAP } from "../lib/constants";
import { translateText } from "../lib/translation";
import { LangPicker } from "../components/LangPicker";

export function TVScreen() {
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
