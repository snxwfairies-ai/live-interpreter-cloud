import { PlanId, getPlans } from "./plans";
import { store, KEYS } from "./storage";

let _rcReady = false;

export async function initRevenueCat(publicKey: string, userId: string) {
  if (!publicKey || publicKey === "YOUR_REVENUECAT_PUBLIC_KEY") return;
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    await Purchases.configure({ apiKey: publicKey, appUserID: userId });
    _rcReady = true;
  } catch {}
}

export async function getCurrentPlan(): Promise<PlanId> {
  const cached = await store.get<PlanId>(KEYS.USER_PLAN);
  if (_rcReady) {
    try {
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      const info = await Purchases.getCustomerInfo();
      const e = info.customerInfo.entitlements.active;
      const RC_ENTITLEMENT = { starter: "starter_access", pro: "pro_access", business: "business_access", enterprise: "enterprise_access" };
      if (e[RC_ENTITLEMENT.enterprise]) return "enterprise";
      if (e[RC_ENTITLEMENT.business])   return "business";
      if (e[RC_ENTITLEMENT.pro])        return "pro";
      if (e[RC_ENTITLEMENT.starter])    return "starter";
      return "free";
    } catch { return cached || "free"; }
  }
  return cached || "free";
}

export async function purchasePlan(planId: PlanId): Promise<{ success: boolean; error?: string }> {
  const plans = getPlans();
  const plan = plans[planId];
  if (!plan.sku_id) return { success: false, error: "No SKU for this plan" };
  if (!_rcReady) return { success: false, error: "Billing not configured. Contact admin." };
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages?.find((p: any) => p.product.identifier === plan.sku_id);
    if (!pkg) return { success: false, error: "Product not found in Play Store" };
    await Purchases.purchasePackage({ aPackage: pkg });
    await store.set(KEYS.USER_PLAN, planId);
    return { success: true };
  } catch (e: any) {
    if (e?.userCancelled) return { success: false, error: "Cancelled" };
    return { success: false, error: e?.message || "Purchase failed" };
  }
}

export async function restorePurchases(): Promise<PlanId> {
  if (!_rcReady) return "free";
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    await Purchases.restorePurchases();
    return getCurrentPlan();
  } catch { return "free"; }
}

export function isRcReady(): boolean { return _rcReady; }
