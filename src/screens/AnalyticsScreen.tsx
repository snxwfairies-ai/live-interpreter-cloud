import React from "react";
import { BarChart3 } from "lucide-react";
import { type PlanId, canUseFeature } from "../lib/plans";

export function AnalyticsScreen({ plan, onNav }:{ plan:PlanId; onNav:(s:string)=>void }) {
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
