import React from "react";
import { motion } from "motion/react";
import { LANGS } from "../lib/constants";

interface Lang { code: string; name: string; flag: string; script: string; sarvam: string | null; indian: boolean; }

export function LangPicker({ title, selected, onPick, onClose, availableCodes }:{
  title:string; selected:Lang; onPick:(l:Lang)=>void; onClose:()=>void; availableCodes?:string[];
}) {
  const langs = availableCodes ? LANGS.filter(l=>availableCodes.includes(l.code)) : LANGS;
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
