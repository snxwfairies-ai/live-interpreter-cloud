import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Crown, MessageSquare, Mic, MicOff, AlertTriangle } from "lucide-react";
import { LANGS, LANG_MAP } from "../lib/constants";
import { type PlanId, getPlan, canUseFeature, maxParticipants } from "../lib/plans";
import { store, KEYS } from "../lib/storage";
import { translateText } from "../lib/translation";

export function RoomScreen({ plan, onNav }:{ plan:PlanId; onNav:(s:string)=>void }) {
  const [joined,setJoined]=useState(false);
  const [userName,setUserName]=useState("");
  const [myLang,setMyLang]=useState(LANGS[0]);
  const [micOn,setMicOn]=useState(true);
  const [isSpeaking,setIsSpeaking]=useState(false);
  const [messages,setMessages]=useState<any[]>([]);
  const [participants,setParticipants]=useState<any[]>([]);
  const [serverUrl,setServerUrl]=useState("");
  const wsRef=useRef<WebSocket|null>(null);
  const recRef=useRef<any>(null);
  const userId=useRef(`u-${Math.random().toString(36).slice(2,8)}`).current;
  const maxP=maxParticipants(plan);
  const hasAccess=canUseFeature(plan,"rooms");

  useEffect(()=>{
    store.get<string>(KEYS.USER_NAME).then(n=>{if(n)setUserName(n);});
    store.get<string>(KEYS.ROOM_SERVER_URL).then(u=>{if(u)setServerUrl(u);});
  },[]);

  useEffect(()=>{
    if(!joined||!serverUrl)return;
    const ws=new WebSocket(serverUrl);
    wsRef.current=ws;
    ws.onopen=()=>ws.send(JSON.stringify({type:"join",roomId:"SNX-2024",userId,name:userName,lang:myLang.name,micOn}));
    ws.onmessage=async(e)=>{
      const d=JSON.parse(e.data);
      if(d.type==="room_state")          setParticipants(d.members);
      else if(d.type==="user_joined")    setParticipants(p=>[...p,d.user]);
      else if(d.type==="user_left")      setParticipants(p=>p.filter((x:any)=>x.id!==d.userId));
      else if(d.type==="mic_status")     setParticipants(p=>p.map((x:any)=>x.id===d.userId?{...x,micOn:d.micOn}:x));
      else if(d.type==="speaking_status")setParticipants(p=>p.map((x:any)=>x.id===d.userId?{...x,speaking:d.speaking}:x));
      else if(d.type==="speech"){
        const translated=await translateText(d.text,d.sourceLang,myLang.name);
        setMessages(p=>[...p,{userId:d.userId,userName:d.userName,text:d.text,translated,timestamp:d.timestamp}].slice(-20));
      }
    };
    ws.onerror=()=>alert("Cannot connect to room server.");
    return()=>ws.close();
  },[joined,myLang,serverUrl]);

  if(!hasAccess) return (
    <div className="h-full flex flex-col pb-[70px] items-center justify-center px-8 gap-5">
      <Crown size={48} color="#fbbf24" strokeWidth={1.5}/>
      <div className="text-center">
        <div className="text-[15px] font-black text-white mb-2">Rooms need Pro or above</div>
        <div className="text-[11px] text-zinc-500 leading-relaxed">Multi-user interpretation rooms are available on Pro, Business, and Enterprise plans.</div>
      </div>
      <button onClick={()=>onNav("plans")} className="bg-gradient-to-r from-pink-600 to-purple-700 text-white font-black text-xs px-6 py-3 rounded-2xl border-none cursor-pointer uppercase tracking-widest">View Plans</button>
    </div>
  );

  const toggleMic=()=>{const n=!micOn;setMicOn(n);wsRef.current?.readyState===WebSocket.OPEN&&wsRef.current.send(JSON.stringify({type:"mic_status",micOn:n}));};
  const startSpeaking=()=>{
    if(!micOn)return;
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(!SR)return;
    setIsSpeaking(true);
    const r=new SR(); r.lang=LANG_MAP[myLang.code]||"en-US";
    r.onresult=(e:any)=>{
      const text=e.results[0][0].transcript;
      wsRef.current?.readyState===WebSocket.OPEN&&wsRef.current.send(JSON.stringify({type:"speech",text,lang:myLang.name}));
      setMessages(p=>[...p,{userId,userName:"You",text,translated:text,timestamp:Date.now()}].slice(-20));
    };
    r.onend=()=>{setIsSpeaking(false);wsRef.current?.readyState===WebSocket.OPEN&&wsRef.current.send(JSON.stringify({type:"speaking_status",speaking:false}));};
    r.start(); recRef.current=r;
    wsRef.current?.readyState===WebSocket.OPEN&&wsRef.current.send(JSON.stringify({type:"speaking_status",speaking:true}));
  };

  const handleJoin=async()=>{if(!userName.trim())return;await store.set(KEYS.USER_NAME,userName.trim());setJoined(true);};

  return (
    <div className="h-full flex flex-col pb-[70px]">
      <div className="px-5 pt-3 pb-1 flex justify-between items-start">
        <div>
          <div className="text-[15px] font-black text-white">Interpretation Room</div>
          <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
            {joined?`${participants.length}/${maxP} participants`:`Max ${maxP} people · ${getPlan(plan).name} plan`}
          </div>
        </div>
        {joined&&<div className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[8px] font-black text-white tracking-[0.2em] uppercase">SNX-2024</div>}
      </div>
      {!joined?(
        <div className="p-4 flex-1 flex flex-col gap-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Your name</div>
            <input type="text" value={userName} onChange={e=>setUserName(e.target.value)} placeholder="e.g. Prashant"
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none mb-4"/>
            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Your language</div>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {LANGS.slice(0,4).map(l=>(
                <button key={l.code} onClick={()=>setMyLang(l)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${myLang.code===l.code?"bg-blue-600/20 border-blue-500/50":"bg-white/5 border-white/5"}`}>
                  <div className="text-xl mb-1">{l.flag}</div><div className="text-[10px] font-black text-white">{l.name}</div>
                </button>
              ))}
            </div>
            {!serverUrl&&<div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 flex gap-2 items-center">
              <AlertTriangle size={14} color="#fbbf24"/><div className="text-[10px] text-amber-300 font-bold">Room server not configured. Ask admin to set server URL in Admin Panel.</div>
            </div>}
            <button onClick={handleJoin} disabled={!userName.trim()||!serverUrl}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black text-xs tracking-widest uppercase border-none cursor-pointer disabled:opacity-40 shadow-lg">
              JOIN ROOM
            </button>
          </div>
        </div>
      ):(
        <>
          <div className="no-scrollbar px-4 py-2 flex gap-2 overflow-x-auto">
            {participants.map((p:any)=>(
              <div key={p.id} className="flex-shrink-0 flex flex-col items-center gap-1.5">
                <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center text-base relative transition-all font-black text-white bg-white/10 ${p.speaking?"border-green-500 shadow-[0_0_14px_rgba(34,197,94,0.35)] scale-105":"border-white/10"}`}>
                  {p.name?.[0]||"?"}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#060B18] flex items-center justify-center ${p.micOn?"bg-green-500":"bg-red-500"}`}>
                    {p.micOn?<Mic size={8} color="white"/>:<MicOff size={8} color="white"/>}
                  </div>
                </div>
                <div className="text-[7px] font-black text-zinc-500 uppercase truncate w-12 text-center">{p.id===userId?"You":p.name}</div>
              </div>
            ))}
          </div>
          <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3">
            {messages.length===0&&<div className="flex flex-col items-center justify-center py-16 opacity-15"><MessageSquare size={40} strokeWidth={1}/><div className="text-[9px] font-black uppercase mt-4 tracking-widest">No messages yet</div></div>}
            {messages.map((m:any,i:number)=>(
              <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className={`flex flex-col ${m.userId===userId?"items-end":"items-start"}`}>
                <div className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1 px-2">{m.userName} · {new Date(m.timestamp).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
                <div className={`max-w-[85%] rounded-2xl p-3 border ${m.userId===userId?"bg-blue-600/10 border-blue-500/20":"bg-white/5 border-white/10"}`}>
                  <div className="text-[10px] text-zinc-500 font-medium italic mb-1">"{m.text}"</div>
                  <div className="text-[12px] text-white font-black leading-tight">{m.translated}</div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="p-4 bg-black/40 border-t border-white/5 flex gap-3">
            <button onClick={toggleMic} className={`w-12 h-12 rounded-2xl border flex items-center justify-center cursor-pointer transition-all ${micOn?"bg-green-500/10 border-green-500/30 text-green-500":"bg-red-500/10 border-red-500/30 text-red-500"}`}>
              {micOn?<Mic size={20}/>:<MicOff size={20}/>}
            </button>
            <button onClick={startSpeaking} disabled={!micOn} className={`flex-1 rounded-2xl font-black text-xs tracking-widest uppercase transition-all border-none cursor-pointer disabled:opacity-40 ${isSpeaking?"bg-red-600 text-white":"bg-blue-600 text-white"}`}>
              {isSpeaking?"LISTENING…":"TAP TO SPEAK"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
