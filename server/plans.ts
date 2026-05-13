/* ═══════════════════════════════════════════════════════════════
   SUBSCRIPTION PLANS
   Play Store Product IDs and limits
═══════════════════════════════════════════════════════════════ */

export type PlanId = "free" | "starter" | "pro" | "business" | "enterprise";

export interface Plan {
  id:               PlanId;
  name:             string;
  price_inr:        number;     // Monthly price in INR
  price_usd:        number;     // Monthly price in USD
  play_product_id:  string;     // Google Play subscription product ID
  sessions_per_day: number;     // -1 = unlimited
  max_session_mins: number;     // -1 = unlimited
  max_room_members: number;     // 0 = no rooms
  languages:        number;     // number of supported languages
  history_days:     number;     // 0 = none
  analytics:        boolean;
  api_access:       boolean;
  priority_stt:     boolean;
  white_label:      boolean;
  description:      string;
  badge?:           string;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id:              "free",
    name:            "Free",
    price_inr:       0,
    price_usd:       0,
    play_product_id: "",
    sessions_per_day: 5,
    max_session_mins: 3,
    max_room_members: 0,
    languages:       4,
    history_days:    0,
    analytics:       false,
    api_access:      false,
    priority_stt:    false,
    white_label:     false,
    description:     "Try the app for free",
  },
  starter: {
    id:              "starter",
    name:            "Starter",
    price_inr:       149,
    price_usd:       1.99,
    play_product_id: "com.snxwfairies.liveinterpreter.starter_monthly",
    sessions_per_day: 30,
    max_session_mins: 15,
    max_room_members: 0,
    languages:       10,
    history_days:    7,
    analytics:       false,
    api_access:      false,
    priority_stt:    false,
    white_label:     false,
    description:     "For regular individual use",
    badge:           "POPULAR",
  },
  pro: {
    id:              "pro",
    name:            "Pro",
    price_inr:       399,
    price_usd:       4.99,
    play_product_id: "com.snxwfairies.liveinterpreter.pro_monthly",
    sessions_per_day: -1,
    max_session_mins: 30,
    max_room_members: 5,
    languages:       10,
    history_days:    30,
    analytics:       true,
    api_access:      false,
    priority_stt:    true,
    white_label:     false,
    description:     "Unlimited sessions + group rooms",
  },
  business: {
    id:              "business",
    name:            "Business",
    price_inr:       999,
    price_usd:       12.99,
    play_product_id: "com.snxwfairies.liveinterpreter.business_monthly",
    sessions_per_day: -1,
    max_session_mins: -1,
    max_room_members: 10,
    languages:       10,
    history_days:    90,
    analytics:       true,
    api_access:      false,
    priority_stt:    true,
    white_label:     false,
    description:     "Teams & professional interpreters",
  },
  enterprise: {
    id:              "enterprise",
    name:            "Enterprise",
    price_inr:       2999,
    price_usd:       35.99,
    play_product_id: "com.snxwfairies.liveinterpreter.enterprise_monthly",
    sessions_per_day: -1,
    max_session_mins: -1,
    max_room_members: 50,
    languages:       10,
    history_days:    365,
    analytics:       true,
    api_access:      true,
    priority_stt:    true,
    white_label:     true,
    description:     "Enterprises, courts, hospitals",
  },
};

export function getPlan(id: string): Plan {
  return PLANS[id as PlanId] || PLANS.free;
}

/* ── Limit checks ────────────────────────────────────────────── */
export function canStartSession(user: any): { ok: boolean; reason?: string } {
  const plan = getPlan(user.plan);
  if (user.is_blocked) return { ok: false, reason: "Account suspended. Contact support." };
  if (plan.sessions_per_day !== -1 && user.sessions_today >= plan.sessions_per_day) {
    return { ok: false, reason: `Daily limit of ${plan.sessions_per_day} sessions reached. Upgrade to continue.` };
  }
  return { ok: true };
}

export function canJoinRoom(user: any): { ok: boolean; reason?: string } {
  const plan = getPlan(user.plan);
  if (plan.max_room_members === 0) return { ok: false, reason: "Room feature requires Starter plan or above." };
  return { ok: true };
}

export function isPlanExpired(user: any): boolean {
  if (!user.plan_expires_at) return false;
  return Date.now() / 1000 > user.plan_expires_at;
}
