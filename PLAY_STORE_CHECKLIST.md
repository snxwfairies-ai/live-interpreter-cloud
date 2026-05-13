# 🏪 Play Store Launch Checklist
### Live Interpreter Pro · snxwfairies innovations pvt. ltd

---

## ① BUILD SIGNED APK / AAB

In Android Studio:

1. **Build → Generate Signed Bundle / APK**
2. Select **Android App Bundle (.aab)** — required for Play Store
3. Click **New…** to create a keystore:
   - Save `live_interpreter_keystore.jks` somewhere SAFE (you need it forever)
   - Fill: Key alias, password, name, country
4. Build → **release** track
5. AAB file location: `android/app/release/app-release.aab`

> ⚠️ NEVER lose the keystore file. You cannot update the app without it.

---

## ② GOOGLE PLAY CONSOLE SETUP

1. Go to: https://play.google.com/console
2. Create a developer account (one-time $25 fee)
3. **Create app** → Live Interpreter → Android → App → Free → Accept policies

---

## ③ APP STORE LISTING (required)

### Main listing
| Field | Value |
|---|---|
| App name | Live Interpreter |
| Short description | Real-time voice interpretation in 16 languages |
| Full description | (see below) |
| Category | Productivity / Tools |
| Content rating | Everyone |
| Tags | interpreter, translation, Hindi, Tamil, Telugu, voice |

### Full description (copy-paste):
```
Live Interpreter – Real-time Voice Interpretation

Speak in any language and instantly hear the translation in another. Perfect for:
• Business meetings with clients who speak different languages
• Family conversations across language barriers
• Travel and tourism
• Medical consultations
• Educational sessions

🇮🇳 INDIAN LANGUAGES OPTIMIZED
Powered by Sarvam.ai (Mayura model) — purpose-built for Indian languages:
Hindi, Telugu, Tamil, Marathi, Kannada, Malayalam, Gujarati, Bengali

🌍 GLOBAL LANGUAGES
English, Arabic, French, German, Japanese, Chinese, Spanish, Russian — powered by Claude AI

✨ KEY FEATURES
• Bidirectional interpretation in real-time
• TV & Streaming mode — interpret Netflix, YouTube, any app
• Multi-user interpretation rooms
• 16 languages supported
• Ultra-low latency (< 2 seconds)
• Offline translation cache

SUBSCRIPTION PLANS
Free | Starter ₹99/mo | Pro ₹299/mo | Business ₹999/mo | Enterprise ₹4,999/mo

Subscriptions are billed monthly through Google Play. Cancel anytime.
```

---

## ④ SCREENSHOTS REQUIRED

Minimum 2, up to 8 screenshots. Sizes: 1080×1920 or 1242×2208.

Recommended screens to capture:
1. Call Interpreter (active, showing translation)
2. Language selector
3. TV & Streaming mode
4. Multi-user Room
5. Plans screen
6. Analytics screen

Use Android Studio → Emulator for clean screenshots.

---

## ⑤ PRIVACY POLICY (REQUIRED)

You MUST have a privacy policy URL. Host it anywhere (GitHub Pages is free).

Minimum content required:
```
Privacy Policy — Live Interpreter
Last updated: [date]

1. Data Collection
We collect: microphone audio (processed locally), usage statistics.
We do NOT store audio recordings.

2. Third-party Services
- Sarvam.ai: Indian language translation (audio text sent)
- Anthropic Claude: Non-Indian language translation (text sent)
- RevenueCat: Subscription management (purchase info)
- Google Play Billing: Payment processing

3. API Keys
Admin API keys are stored locally on device only.
They are never transmitted to our servers.

4. Contact
privacy@snxwfairies.com
snxwfairies.com
```

---

## ⑥ REVENUECAT SETUP (In-App Billing)

### Step A — Create RevenueCat account
1. Go to: https://app.revenuecat.com
2. Sign up → Create new project: "Live Interpreter"
3. Add Android app → Enter package: `com.snxwfairies.liveinterpreter`

### Step B — Create products in Play Console
Go to Play Console → your app → **Monetize → Subscriptions** → Create:

| Product ID | Name | Price |
|---|---|---|
| `live_interpreter_starter_monthly` | Starter Monthly | ₹99/month |
| `live_interpreter_pro_monthly` | Pro Monthly | ₹299/month |
| `live_interpreter_business_monthly` | Business Monthly | ₹999/month |
| `live_interpreter_enterprise_monthly` | Enterprise Monthly | ₹4,999/month |

### Step C — Link to RevenueCat
1. In RevenueCat → Products → Add products (copy the IDs above)
2. Create Entitlements:
   - `starter_access` → link starter product
   - `pro_access` → link pro product
   - `business_access` → link business product
   - `enterprise_access` → link enterprise product
3. Create an Offering called "default" with all packages

### Step D — Get Public SDK Key
RevenueCat → your app → API Keys → **Public SDK Key**
(looks like `appl_xxxx` or `goog_xxxx`)

### Step E — Set in app
Open Live Interpreter → Settings → tap logo 7 times → Admin Panel → paste RevenueCat Public Key → Save

---

## ⑦ ADMIN PANEL SETUP (API Keys)

After installing on your phone:

1. Open the app → Settings tab
2. Tap the profile avatar **7 times quickly** → Admin Panel opens
3. Fill in:

| Field | Where to get |
|---|---|
| Claude API Key | console.anthropic.com → API Keys |
| Sarvam.ai API Key | console.sarvam.ai → API Keys |
| RevenueCat Key | app.revenuecat.com → API Keys |
| Room Server URL | Your server IP (for multi-user rooms) |

4. Tap **Save Configuration**

---

## ⑧ RELEASE TRACKS

| Track | Purpose |
|---|---|
| Internal testing | You + 1-2 testers only |
| Closed testing (Alpha) | Up to 100 testers |
| Open testing (Beta) | Anyone can join |
| Production | Full public release |

**Recommended path:**
Internal → Closed (2 weeks testing) → Production

---

## ⑨ REVENUE PROJECTIONS

| Plan | Price | 100 users | 500 users | 2,000 users |
|---|---|---|---|---|
| Starter | ₹99/mo | ₹9,900 | ₹49,500 | ₹1,98,000 |
| Pro | ₹299/mo | ₹29,900 | ₹1,49,500 | ₹5,98,000 |
| Business | ₹999/mo | ₹99,900 | ₹4,99,500 | ₹19,98,000 |
| Enterprise | ₹4,999/mo | ₹4,99,900 | — | — |

**API Cost estimate (Claude + Sarvam.ai):**
- ~₹0.50–₹2.00 per session depending on length
- Pro plan (₹299) supports ~150 sessions/month → ~₹150 API cost → ₹149 margin

**Google Play takes 15%** (first ₹10L revenue), then 30%.

---

## ⑩ PRE-LAUNCH CHECKLIST

- [ ] AAB built and signed with keystore
- [ ] keystore file backed up in 2 places
- [ ] Privacy Policy URL live
- [ ] Screenshots ready (min 2)
- [ ] App icon 512×512 PNG ready
- [ ] Feature graphic 1024×500 PNG ready
- [ ] Play Console account created ($25 paid)
- [ ] All 4 subscription products created in Play Console
- [ ] RevenueCat linked to Play Console
- [ ] RevenueCat Public Key set in Admin Panel
- [ ] Claude + Sarvam.ai API keys set in Admin Panel
- [ ] Tested on physical Android device
- [ ] Microphone permission works
- [ ] At least one translation tested end-to-end
- [ ] Subscription purchase tested (use test card in Play Console)

---

## SUPPORT CONTACTS

| Service | Link |
|---|---|
| Google Play Console | play.google.com/console |
| RevenueCat Docs | docs.revenuecat.com |
| Sarvam.ai Console | console.sarvam.ai |
| Anthropic Console | console.anthropic.com |

© 2026 snxwfairies innovations pvt. ltd
