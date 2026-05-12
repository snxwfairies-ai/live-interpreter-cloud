# 🧚 Live Interpreter — Cloud Edition
### snxwfairies innovations pvt. ltd

Works on local PC AND from anywhere via internet.
HTTPS included automatically (free SSL). Works on any Android phone.

---

## CHOOSE YOUR OPTION

| Option | Cost | Time to deploy |
|---|---|---|
| **Railway.app** | Free tier | 10 minutes |
| **DigitalOcean VPS** | ~$6/month | 20 minutes |
| **Any Ubuntu VPS** | Varies | 20 minutes |

---

## OPTION A — Railway.app (Easiest, Free)

### 1. Upload to GitHub
- Go to github.com → create free account → New repository → `live-interpreter`
- Upload all files from this ZIP

### 2. Deploy on Railway
- Go to railway.app → Sign up with GitHub
- New Project → Deploy from GitHub repo → select `live-interpreter`
- Railway auto-detects Node.js and deploys in ~2 minutes

### 3. Set Environment Variables
In Railway → your project → Variables tab:

| Variable | Value |
|---|---|
| `CLAUDE_API_KEY` | your Claude key |
| `SARVAM_API_KEY` | your Sarvam key |
| `ADMIN_SECRET` | choose a strong password |
| `NODE_ENV` | production |

### 4. Done!
Railway gives you a URL like:
`https://live-interpreter-xxxx.up.railway.app`

Open on any phone — HTTPS works automatically. No domain needed.

### 5. Install as App (PWA)
Once deployed, open the Railway URL on your phone or desktop browser:

| Platform | How to install |
|---|---|
| **Android (Chrome)** | Tap the menu (⋮) → "Add to Home screen" → Install |
| **iPhone (Safari)** | Tap Share (⬆️) → "Add to Home Screen" |
| **Desktop (Chrome/Edge)** | Click the install icon (🖥️➕) in the address bar |

The app works **offline** for the UI shell and caches static assets. API calls require internet.

---

## OPTION B — DigitalOcean / Any Ubuntu VPS

### 1. Create a $6/month Ubuntu 22.04 server on DigitalOcean

### 2. SSH in and run setup script
```bash
ssh root@YOUR_SERVER_IP
bash setup-vps.sh
```
Script asks for domain, API keys, admin secret — does everything.

### 3. Upload files
```bash
scp -r server.js package.json public/ root@YOUR_IP:/opt/live-interpreter/app/
```

### 4. Start
```bash
cd /opt/live-interpreter && docker compose up -d
```

### 5. Point domain DNS → server IP, wait 10 min → HTTPS auto-activates

---

## SETTING API KEYS AFTER DEPLOY

1. Open your app URL → Settings ⚙️
2. Enter your **Admin Secret** in the field shown
3. Paste Claude key → Save
4. Paste Sarvam key → Save

On local PC: leave Admin Secret blank.
On cloud: enter the ADMIN_SECRET you set in environment variables.

---

## USEFUL COMMANDS

```bash
docker compose logs -f      # Watch live logs
docker compose restart       # Restart app
docker compose down          # Stop
docker compose up -d         # Start
docker ps                    # Check running
```

---

## WHAT THIS FIXES vs LOCAL

| Local problem | Cloud fix |
|---|---|
| Phone needs same Wi-Fi | ✅ Works from anywhere |
| PC must stay ON | ✅ Server runs 24/7 |
| No HTTPS → mic blocked | ✅ Automatic free SSL |
| Can't share with remote users | ✅ Anyone can access |
| Room limited to one office | ✅ Global rooms |
| No app icon / install | ✅ PWA — install on home screen |

---

## FILES

```
├── server.js          ← Backend (env vars + admin secret + rate limiting)
├── package.json       ← express + ws only
├── public/
│   ├── index.html     ← Full app (SPA)
│   ├── manifest.json  ← PWA manifest
│   ├── sw.js          ← Service Worker (offline caching)
│   ├── icon.svg       ← App icon (vector)
│   ├── icon-192.png   ← App icon (192×192)
│   └── icon-512.png   ← App icon (512×512)
├── railway.json       ← Railway config
├── Dockerfile         ← Docker build
├── docker-compose.yml ← VPS: app + Caddy HTTPS
├── Caddyfile          ← Auto HTTPS config
├── setup-vps.sh       ← One-command VPS setup
└── .env.example       ← Environment variables template
```

---

© 2026 snxwfairies innovations pvt. ltd · support@snxwfairies.com
