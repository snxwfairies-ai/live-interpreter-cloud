/**
 * Subscription Manager
 * ─────────────────────────────────────────────────────────
 * Uses RevenueCat (purchases-capacitor) for Google Play Billing.
 * Falls back to free plan if RevenueCat not configured.
 * ─────────────────────────────────────────────────────────
 */
import { PLANS, PlanId, RC_ENTITLEMENT } from "./constants";
import { store, KEYS } from "./storage";

let _rcReady = false;

// ─── Initialize RevenueCat ────────────────────────────────────────────────────
export async function initRevenueCat(publicKey: string, userId: string) {
  if (!publicKey || publicKey === "YOUR_REVENUECAT_PUBLIC_KEY") return;
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    await Purchases.configure({ apiKey: publicKey, appUserID: userId });
    _rcReady = true;
    console.log("[RC] Initialized");
  } catch (e) {
    console.warn("[RC] Init failed:", e);
  }
}

// ─── Get current plan ─────────────────────────────────────────────────────────
export async function getCurrentPlan(): Promise<PlanId> {
  // Check local cache first (fast)
  const cached = await store.get<PlanId>(KEYS.USER_PLAN);

  if (_rcReady) {
    try {
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      const info = await Purchases.getCustomerInfo();
      const entitlements = info.customerInfo.entitlements.active;

      if (entitlements[RC_ENTITLEMENT.enterprise]) return "enterprise";
      if (entitlements[RC_ENTITLEMENT.business])   return "business";
      if (entitlements[RC_ENTITLEMENT.pro])        return "pro";
      if (entitlements[RC_ENTITLEMENT.starter])    return "starter";
      return "free";
    } catch {
      return cached || "free";
    }
  }
  return cached || "free";
}

// ─── Purchase a plan ──────────────────────────────────────────────────────────
export async function purchasePlan(planId: PlanId): Promise<{ success: boolean; error?: string }> {
  const plan = PLANS[planId];
  if (!plan.skuId) return { success: false, error: "No SKU for this plan" };

  if (!_rcReady) {
    return {
      success: false,
      error: "Billing not configured. Contact admin.",
    };
  }

  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages?.find(
      (p: any) => p.product.identifier === plan.skuId
    );
    if (!pkg) return { success: false, error: "Product not found in Play Store" };

    await Purchases.purchasePackage({ aPackage: pkg });
    await store.set(KEYS.USER_PLAN, planId);
    return { success: true };
  } catch (e: any) {
    if (e?.userCancelled) return { success: false, error: "Cancelled" };
    return { success: false, error: e?.message || "Purchase failed" };
  }
}

// ─── Restore purchases ────────────────────────────────────────────────────────
export async function restorePurchases(): Promise<PlanId> {
  if (!_rcReady) return "free";
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    await Purchases.restorePurchases();
    return getCurrentPlan();
  } catch { return "free"; }
}

// ─── Session limiting ─────────────────────────────────────────────────────────
export async function canStartSession(planId: PlanId): Promise<{ allowed: boolean; reason?: string }> {
  const plan = PLANS[planId];
  const limit = plan.limits.sessionsPerDay;

  if (limit >= 999) return { allowed: true };

  const today = new Date().toDateString();
  const savedDate  = await store.get<string>(KEYS.SESSION_DATE);
  const savedCount = await store.get<number>(KEYS.SESSION_COUNT) || 0;

  const count = savedDate === today ? savedCount : 0;

  if (count >= limit) {
    return {
      allowed: false,
      reason: `Daily limit reached (${limit} sessions). Upgrade for more.`,
    };
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

// ─── Feature gate check ───────────────────────────────────────────────────────
export function canUseFeature(planId: PlanId, feature: "rooms" | "analytics" | "history" | "allLanguages"): boolean {
  const limits = PLANS[planId].limits as any;
  if (feature === "rooms")        return (limits.maxParticipants || 0) > 0;
  if (feature === "analytics")    return !!limits.analytics;
  if (feature === "history")      return !!limits.history;
  if (feature === "allLanguages") return limits.languages === "all";
  return false;
}

export function maxParticipants(planId: PlanId): number {
  return (PLANS[planId].limits as any).maxParticipants || 0;
}
