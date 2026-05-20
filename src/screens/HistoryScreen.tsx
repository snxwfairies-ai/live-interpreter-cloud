import React, { useEffect, useState } from "react";
import { History, Loader2, ArrowLeftRight } from "lucide-react";
import { type PlanId, canUseFeature } from "../lib/plans";
import { store, KEYS } from "../lib/storage";

interface CallEntry { participant:string; fromLang:string; toLang:string; duration:string; timestamp:number; }

export function HistoryScreen({ plan, onNav }:{ plan:PlanId; onNav:(s:string)=>void }) {
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
