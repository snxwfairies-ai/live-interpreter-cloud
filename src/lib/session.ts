import { PlanId, getPlan } from "./plans";
import { store, KEYS } from "./storage";

export async function canStartSession(planId: PlanId): Promise<{ allowed: boolean; reason?: string }> {
  const plan = getPlan(planId);
  const limit = plan.sessions_per_day;
  if (limit === -1) return { allowed: true };
  const today = new Date().toDateString();
  const savedDate  = await store.get<string>(KEYS.SESSION_DATE);
  const savedCount = await store.get<number>(KEYS.SESSION_COUNT) || 0;
  const count = savedDate === today ? savedCount : 0;
  if (count >= limit) {
    return { allowed: false, reason: `Daily limit reached (${limit} sessions). Upgrade for more.` };
  }
  return { allowed: true };
}

export async function recordSession() {
  const today = new Date().toDateString();
  const savedDate  = await store.get<string>(KEYS.SESSION_DATE);
  const savedCount = await store.get<number>(KEYS.SESSION_COUNT) || 0;
  const count = savedDate === today ? savedCount + 1 : 1;
  await store.set(KEYS.SESSION_DATE, today);
  await store.set(KEYS.SESSION_COUNT, count);
}
