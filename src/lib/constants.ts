// ─── Languages ──────────────────────────────────────────────────────────────
export const LANGS = [
  { code:"hi", name:"Hindi",     flag:"🇮🇳", script:"हिंदी",    sarvam:"hi-IN", indian:true  },
  { code:"te", name:"Telugu",    flag:"🇮🇳", script:"తెలుగు",   sarvam:"te-IN", indian:true  },
  { code:"ta", name:"Tamil",     flag:"🇮🇳", script:"தமிழ்",    sarvam:"ta-IN", indian:true  },
  { code:"mr", name:"Marathi",   flag:"🇮🇳", script:"मराठी",    sarvam:"mr-IN", indian:true  },
  { code:"kn", name:"Kannada",   flag:"🇮🇳", script:"ಕನ್ನಡ",    sarvam:"kn-IN", indian:true  },
  { code:"ml", name:"Malayalam", flag:"🇮🇳", script:"മലയാളം",   sarvam:"ml-IN", indian:true  },
  { code:"gu", name:"Gujarati",  flag:"🇮🇳", script:"ગુજરાતી",  sarvam:"gu-IN", indian:true  },
  { code:"bn", name:"Bengali",   flag:"🇮🇳", script:"বাংলা",    sarvam:"bn-IN", indian:true  },
  { code:"en", name:"English",   flag:"🇺🇸", script:"English",  sarvam:"en-IN", indian:false },
  { code:"ar", name:"Arabic",    flag:"🇸🇦", script:"عربي",     sarvam:null,    indian:false },
  { code:"fr", name:"French",    flag:"🇫🇷", script:"Français", sarvam:null,    indian:false },
  { code:"de", name:"German",    flag:"🇩🇪", script:"Deutsch",  sarvam:null,    indian:false },
  { code:"ja", name:"Japanese",  flag:"🇯🇵", script:"日本語",    sarvam:null,    indian:false },
  { code:"zh", name:"Chinese",   flag:"🇨🇳", script:"中文",      sarvam:null,    indian:false },
  { code:"es", name:"Spanish",   flag:"🇪🇸", script:"Español",  sarvam:null,    indian:false },
  { code:"ru", name:"Russian",   flag:"🇷🇺", script:"Русский",  sarvam:null,    indian:false },
];

export const LANG_MAP: Record<string,string> = {
  hi:"hi-IN", te:"te-IN", ta:"ta-IN", mr:"mr-IN", kn:"kn-IN",
  ml:"ml-IN", gu:"gu-IN", bn:"bn-IN", en:"en-US", ar:"ar-SA",
  fr:"fr-FR", de:"de-DE", ja:"ja-JP", zh:"zh-CN", es:"es-ES", ru:"ru-RU",
};

// ─── Subscription Plans ──────────────────────────────────────────────────────
export const PLANS = {
  free: {
    id:       "free",
    name:     "Free",
    icon:     "🆓",
    price:    0,
    priceStr: "₹0",
    period:   "Forever",
    skuId:    null,                        // no Play Store product
    color:    "rgba(255,255,255,0.08)",
    limits: {
      sessionsPerDay: 5,
      maxMinutes:     5,
      maxParticipants:0,                   // no room access
      languages:      ["hi","en","ta","te","mr"],
      history:        false,
      analytics:      false,
      offline:        false,
    },
    features: ["5 sessions/day","5 min max","5 Indian languages","Basic call mode"],
  },
  starter: {
    id:       "starter",
    name:     "Starter",
    icon:     "🚀",
    price:    99,
    priceStr: "₹99",
    period:   "/month",
    skuId:    "live_interpreter_starter_monthly",
    color:    "rgba(59,130,246,0.12)",
    limits: {
      sessionsPerDay: 30,
      maxMinutes:     15,
      maxParticipants:0,
      languages:      ["hi","en","ta","te","mr","kn","ml","gu","bn"],
      history:        true,
      analytics:      false,
      offline:        false,
    },
    features: ["30 sessions/day","15 min/session","9 Indian languages","Call + TV mode","7-day history"],
  },
  pro: {
    id:       "pro",
    name:     "Pro",
    icon:     "⭐",
    price:    299,
    priceStr: "₹299",
    period:   "/month",
    skuId:    "live_interpreter_pro_monthly",
    color:    "rgba(37,99,235,0.18)",
    popular:  true,
    limits: {
      sessionsPerDay: 999,
      maxMinutes:     60,
      maxParticipants:5,
      languages:      "all",
      history:        true,
      analytics:      true,
      offline:        true,
    },
    features: ["Unlimited sessions","60 min/session","All 16 languages","5-person rooms","30-day history","Analytics","Offline cache"],
  },
  business: {
    id:       "business",
    name:     "Business",
    icon:     "💼",
    price:    999,
    priceStr: "₹999",
    period:   "/month",
    skuId:    "live_interpreter_business_monthly",
    color:    "rgba(5,150,105,0.12)",
    limits: {
      sessionsPerDay: 999,
      maxMinutes:     120,
      maxParticipants:10,
      languages:      "all",
      history:        true,
      analytics:      true,
      offline:        true,
    },
    features: ["Everything in Pro","10-person rooms","120 min/session","Priority translation","Advanced analytics","API access"],
  },
  enterprise: {
    id:       "enterprise",
    name:     "Enterprise",
    icon:     "🏢",
    price:    4999,
    priceStr: "₹4,999",
    period:   "/month",
    skuId:    "live_interpreter_enterprise_monthly",
    color:    "rgba(217,119,6,0.10)",
    limits: {
      sessionsPerDay: 999,
      maxMinutes:     480,
      maxParticipants:50,
      languages:      "all",
      history:        true,
      analytics:      true,
      offline:        true,
    },
    features: ["Everything in Business","50-person rooms","Custom room codes","SSO login","White-label","Dedicated support","Custom contracts"],
  },
} as const;

export type PlanId = keyof typeof PLANS;

// RevenueCat entitlement IDs (set up in RevenueCat dashboard)
export const RC_ENTITLEMENT = {
  starter:    "starter_access",
  pro:        "pro_access",
  business:   "business_access",
  enterprise: "enterprise_access",
};

// RevenueCat Public SDK key — set by super admin
export const RC_API_KEY_PLACEHOLDER = "YOUR_REVENUECAT_PUBLIC_KEY";
