import React from "react";
import { Crown } from "lucide-react";

export function GateBanner({ msg, onUpgrade }:{ msg:string; onUpgrade:()=>void }) {
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
