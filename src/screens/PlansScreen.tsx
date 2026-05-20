import React, { useState } from "react";
import { CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { type PlanId, getPlans, getPlan } from "../lib/plans";
import { purchasePlan, restorePurchases } from "../lib/subscription";
import { store, KEYS } from "../lib/storage";

interface Plan { id: PlanId; name: string; icon: string; price_str: string; period: string; features: string[]; popular?: boolean; }

export function PlansScreen({ currentPlan, onPlanChange }:{ currentPlan:PlanId; onPlanChange:(p:PlanId)=>void }) {
  const [buying,setBuying]=useState<PlanId|null>(null);
  const [restoring,setRestoring]=useState(false);
  const [msg,setMsg]=useState("");
  const plans = getPlans();

  const buy=async(planId:PlanId)=>{
    if(planId==="free"){setMsg("Free plan is already active.");return;}
    setBuying(planId);
    const {success,error}=await purchasePlan(planId);
    setBuying(null);
    if(success){onPlanChange(planId);setMsg(`✅ ${getPlan(planId).name} activated!`);}
    else setMsg(error||"Purchase failed");
    setTimeout(()=>setMsg(""),4000);
  };
  const restore=async()=>{setRestoring(true);const p=await restorePurchases();onPlanChange(p);setRestoring(false);setMsg(`✅ Restored: ${getPlan(p).name}`);setTimeout(()=>setMsg(""),3000);};

  return (
    <div className="h-full flex flex-col pb-[70px]">
      <div className="px-5 pt-3 pb-2">
        <div className="text-[15px] font-black text-white">Subscription Plans</div>
        <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Powered by Google Play Billing</div>
      </div>
      {msg&&<div className={`mx-4 mb-2 p-3 rounded-xl border text-[11px] font-bold flex items-center gap-2 ${msg.startsWith("✅")?"bg-green-500/10 border-green-500/20 text-green-400":"bg-red-500/10 border-red-500/20 text-red-400"}`}><CheckCircle size={14}/>{msg}</div>}
      <div className="no-scrollbar px-3.5 flex-1 overflow-y-auto flex flex-col gap-2">
        {(Object.values(plans) as Plan[]).map(p=>{
          const isActive=currentPlan===p.id;
          return (
            <div key={p.id} className={`border rounded-2xl p-3.5 transition-all ${isActive?"bg-blue-500/10 border-blue-500/50":"bg-white/[0.03] border-white/10"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p.icon}</span>
                  <span className="text-[14px] font-black text-white">{p.name}</span>
                  {p.popular&&<span className="text-[7px] font-black bg-pink-600 text-white px-1.5 py-0.5 rounded-full">POPULAR</span>}
                  {isActive&&<span className="text-[7px] font-black bg-green-500/20 border border-green-500/30 text-green-400 px-1.5 py-0.5 rounded-full">ACTIVE</span>}
                </div>
                <div className="text-right"><span className="text-[17px] font-black text-white">{p.price_str}</span><span className="text-[9px] text-zinc-500 font-bold">{p.period}</span></div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {p.features.map((f:string,i:number)=><span key={i} className="text-[7px] text-zinc-400 font-bold bg-white/5 px-2 py-1 rounded-lg uppercase tracking-widest">✓ {f}</span>)}
              </div>
              {!isActive&&(
                <button onClick={()=>buy(p.id as PlanId)} disabled={!!buying}
                  className={`w-full py-2.5 rounded-xl font-black text-xs text-white border-none cursor-pointer transition-all disabled:opacity-50 ${p.id==="free"?"bg-white/10":"bg-gradient-to-r from-blue-600 to-indigo-700"}`}>
                  {buying===p.id?<span className="flex items-center justify-center gap-2"><Loader2 size={14} className="spin"/> Processing…</span>:p.id==="free"?"Downgrade to Free":`Subscribe · ${p.price_str}/mo`}
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
