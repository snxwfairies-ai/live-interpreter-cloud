import React, { useState, useEffect } from "react";
import { LANGS } from "../lib/constants";
import { store, KEYS } from "../lib/storage";

export function LangPrefsScreen({ onNav }:{ onNav:(s:string)=>void }) {
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
