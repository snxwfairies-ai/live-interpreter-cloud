import { store } from "./storage";

export interface Plan {
  id: string; name: string; price_inr: number; price_usd: number;
  play_product_id: string;
  sessions_per_day: number; max_session_mins: number; max_room_members: number;
  languages: number; history_days: number; analytics: boolean;
  api_access: boolean; priority_stt: boolean; white_label: boolean;
  description: string; badge?: string;
  icon: string; color: string; features: string[]; popular?: boolean;
  price_str: string; period: string; sku_id: string | null;
}

export type PlanId = "free" | "starter" | "pro" | "business" | "enterprise";

const CACHE_KEY = "plans_cache";
const FALLBACK: Record<string, Plan> = {
  free: { id:"free", name:"Free", price_inr:0, price_usd:0, play_product_id:"", sessions_per_day:5, max_session_mins:3, max_room_members:0, languages:4, history_days:0, analytics:false, api_access:false, priority_stt:false, white_label:false, description:"Try the app for free", icon:"🆓", color:"rgba(255,255,255,0.08)", features:["5 sessions/day","3 min max","4 Indian languages","Basic call mode"], sku_id:null, price_str:"₹0", period:"Forever" },
  starter: { id:"starter", name:"Starter", price_inr:149, price_usd:1.99, play_product_id:"", sessions_per_day:30, max_session_mins:15, max_room_members:0, languages:10, history_days:7, analytics:false, api_access:false, priority_stt:false, white_label:false, description:"For regular use", icon:"🚀", color:"rgba(59,130,246,0.12)", features:["30 sessions/day","15 min/session","9 Indian languages","Call + TV mode","7-day history"], sku_id:null, price_str:"₹149", period:"/month", badge:"POPULAR" },
  pro: { id:"pro", name:"Pro", price_inr:399, price_usd:4.99, play_product_id:"", sessions_per_day:-1, max_session_mins:30, max_room_members:5, languages:10, history_days:30, analytics:true, api_access:false, priority_stt:true, white_label:false, description:"Unlimited sessions + group rooms", icon:"⭐", color:"rgba(37,99,235,0.18)", features:["Unlimited sessions","30 min/session","All 16 languages","5-person rooms","30-day history","Analytics","Priority STT"], sku_id:null, price_str:"₹399", period:"/month", popular:true },
  business: { id:"business", name:"Business", price_inr:999, price_usd:12.99, play_product_id:"", sessions_per_day:-1, max_session_mins:-1, max_room_members:10, languages:10, history_days:90, analytics:true, api_access:false, priority_stt:true, white_label:false, description:"Teams & professionals", icon:"💼", color:"rgba(5,150,105,0.12)", features:["Everything in Pro","10-person rooms","Unlimited duration","Priority translation","Advanced analytics","API access"], sku_id:null, price_str:"₹999", period:"/month" },
  enterprise: { id:"enterprise", name:"Enterprise", price_inr:2999, price_usd:35.99, play_product_id:"", sessions_per_day:-1, max_session_mins:-1, max_room_members:50, languages:10, history_days:365, analytics:true, api_access:true, priority_stt:true, white_label:true, description:"Enterprises, courts, hospitals", icon:"🏢", color:"rgba(217,119,6,0.10)", features:["Everything in Business","50-person rooms","Custom room codes","SSO login","White-label","Dedicated support","Custom contracts"], sku_id:null, price_str:"₹4,999", period:"/month" },
};

let _plans: Record<string, Plan> | null = null;

export async function loadPlans(): Promise<Record<string, Plan>> {
  if (_plans) return _plans;
  const cached = await store.get<Record<string, Plan>>(CACHE_KEY);
  if (cached) { _plans = cached; return cached; }
  try {
    const res = await fetch("/api/plans");
    const data = await res.json();
    _plans = data.plans;
    await store.set(CACHE_KEY, _plans);
    return _plans!;
  } catch {
    _plans = FALLBACK;
    return FALLBACK;
  }
}

export function getPlans(): Record<string, Plan> {
  return _plans || FALLBACK;
}

export function getPlan(id: string): Plan {
  return getPlans()[id] || getPlans().free;
}

export function canUseFeature(planId: PlanId, feature: "rooms" | "analytics" | "history" | "allLanguages"): boolean {
  const plan = getPlan(planId);
  if (feature === "rooms") return (plan.max_room_members || 0) > 0;
  if (feature === "analytics") return !!plan.analytics;
  if (feature === "history") return plan.history_days > 0;
  if (feature === "allLanguages") return plan.languages === 10 || plan.languages === -1;
  return false;
}

export function maxParticipants(planId: PlanId): number {
  return getPlan(planId).max_room_members || 0;
}
