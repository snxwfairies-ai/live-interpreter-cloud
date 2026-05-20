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

export type PlanId = "free" | "starter" | "pro" | "business" | "enterprise";
