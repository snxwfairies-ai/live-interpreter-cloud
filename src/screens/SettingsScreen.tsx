import React from "react";
import { BarChart3, History, Globe, HelpCircle, Star, Cloud, Lock, Shield, Info } from "lucide-react";
import { type PlanId, getPlan } from "../lib/plans";
import { engineStatus } from "../lib/translation";

export function SettingsScreen({ onNav, plan, userName, logoTaps, onLogoTap }:{
  onNav:(s:string)=>void; plan:PlanId; userName:string; logoTaps:number; onLogoTap:()=>void;
}) {
  const engine = engineStatus();
  const planData = getPlan(plan);
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
