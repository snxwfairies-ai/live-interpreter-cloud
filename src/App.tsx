import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Phone, Tv, Users, Settings } from "lucide-react";

import { type PlanId } from "./lib/plans";
import { loadPlans } from "./lib/plans";
import { store, KEYS } from "./lib/storage";
import { loadCache, initDeviceAuth } from "./lib/translation";
import { initRevenueCat, getCurrentPlan } from "./lib/subscription";
import { AdminPanel } from "./components/AdminPanel";

import { CallScreen } from "./screens/CallScreen";
import { TVScreen } from "./screens/TVScreen";
import { RoomScreen } from "./screens/RoomScreen";
import { PlansScreen } from "./screens/PlansScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { AnalyticsScreen } from "./screens/AnalyticsScreen";
import { SupportScreen } from "./screens/SupportScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { LangPrefsScreen } from "./screens/LangPrefsScreen";

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
      await Promise.all([
        loadCache(),
        loadPlans(),
        initDeviceAuth(),
      ]);
      const [name, savedPlan] = await Promise.all([
        store.get<string>(KEYS.USER_NAME),
        store.get<PlanId>(KEYS.USER_PLAN),
      ]);
      if(name) setUserName(name);
      const rcKey = await store.get<string>(KEYS.RC_PUBLIC_KEY);
      if(rcKey) {
        const userId=`user_${Math.random().toString(36).slice(2,10)}`;
        await initRevenueCat(rcKey, userId);
      }
      const currentPlan = await getCurrentPlan();
      setPlan(currentPlan || (savedPlan || "free"));
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
