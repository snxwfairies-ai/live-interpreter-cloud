import React, { useState, useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";

export function SupportScreen({ onNav }:{ onNav:(s:string)=>void }) {
  const [messages,setMessages]=useState([{bot:true,text:"Hello! 👋 I'm your Live Interpreter support assistant. How can I help?",qr:["App not working","Payment issue","How to use?","Talk to human"]}]);
  const [input,setInput]=useState(""); const [typing,setTyping]=useState(false);
  const endRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[messages,typing]);
  const respond=(msg:string)=>{
    setMessages(p=>[...p,{bot:false,text:msg,qr:[]}]);
    setTyping(true);
    setTimeout(()=>{
      setTyping(false);
      const r:any=({
        "App not working":{text:"Try:\n1. Close & reopen the app\n2. Check internet connection\n3. Re-enter API key in Settings\n4. Contact support if issue persists",qr:["Still broken","Fixed!"]},
        "Payment issue":{text:"Subscriptions are processed through Google Play. For refunds, go to play.google.com/store/account.\n\nOr email: billing@snxwfairies.com",qr:["Need refund","Talk to human"]},
        "How to use?":{text:"1. Go to 📞 Call tab\n2. Tap languages to select source & target\n3. Put on headphones\n4. Tap 'Start Interpreter'\n5. Speak naturally!",qr:["What's Sarvam.ai?","Tell me more","Thanks!"]},
        "What's Sarvam.ai?":{text:"Sarvam.ai is an Indian AI company specialized in Indian language translation. This app uses their Mayura model for superior accuracy in Hindi, Telugu, Tamil, Marathi, Kannada, Malayalam, Gujarati, and Bengali.",qr:["Thanks!"]},
        "Talk to human":{text:"✅ Connecting to support…\n\nTicket: TKT-"+Math.random().toString(36).slice(2,8).toUpperCase()+"\n\nExpected response: within 24 hours.\n\nEmail: support@snxwfairies.com",qr:[]},
      })[msg]||{text:"Please email support@snxwfairies.com — we reply within 24 hours.",qr:["Talk to human"]};
      setMessages(p=>[...p,{bot:true,...r}]);
    },1200);
  };
  return (
    <div className="h-full flex flex-col pb-[70px]">
      <div className="px-4 pt-3 pb-2 flex items-center gap-3 border-b border-white/5">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-lg">🤖</div>
        <div className="flex-1"><div className="text-[12px] font-black text-white">Live Support</div><div className="text-[8px] text-green-500 font-black uppercase tracking-widest">🟢 AI Assistant</div></div>
        <button onClick={()=>onNav("settings")} className="text-[10px] text-blue-500 font-black uppercase bg-transparent border-none cursor-pointer">← Back</button>
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto px-3.5 py-3 flex flex-col gap-2.5">
        {messages.map((m,i)=>(
          <div key={i} className={`flex flex-col ${m.bot?"items-start":"items-end"} gap-1.5`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] leading-relaxed font-medium whitespace-pre-line ${m.bot?"bg-white/5 border border-white/10 text-zinc-300":"bg-blue-600/20 border border-blue-500/30 text-blue-100"}`}>{m.text}</div>
            {m.qr?.length>0&&<div className="flex flex-wrap gap-1.5">{m.qr.map((q:string,j:number)=><button key={j} onClick={()=>respond(q)} className="text-[8px] font-black px-2.5 py-1.5 rounded-xl border border-blue-500/30 text-blue-400 bg-blue-500/5 uppercase tracking-widest cursor-pointer">{q}</button>)}</div>}
          </div>
        ))}
        {typing&&<div className="flex gap-1 p-2.5 bg-white/5 rounded-xl w-14">{[0,1,2].map(i=><div key={i} className="pulse-dot w-1.5 h-1.5 rounded-full bg-zinc-600" style={{animationDelay:`${i*0.2}s`}}/>)}</div>}
        <div ref={endRef}/>
      </div>
      <div className="px-3.5 pt-2 flex gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&input.trim()){respond(input.trim());setInput("");}}} placeholder="Type your question…" className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-white text-[11px] outline-none font-medium"/>
        <button onClick={()=>{if(input.trim()){respond(input.trim());setInput("");}}} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white border-none cursor-pointer flex-shrink-0"><ChevronRight size={20}/></button>
      </div>
    </div>
  );
}
