# Deploy to Vercel

## Option A — GitHub (recommended)

### 1. Push code to GitHub

From PowerShell:

```powershell
cd "c:\Users\HP\Downloads\lead redirector\dashboard"
git init
git add .
git commit -m "Lead redirector: webhook + Supabase + dashboard"
```

Create a new repo on https://github.com/new (empty, no README), then:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 2. Import on Vercel

1. Go to https://vercel.com/new
2. **Import** your GitHub repository
3. **Root Directory**: leave as `.` if the repo root *is* the `dashboard` folder, OR set **`dashboard`** if the repo contains the parent `lead redirector` folder
4. Framework: **Vite** (auto-detected)
5. Build command: `npm run build`
6. Output directory: `dist`

### 3. Environment variables

In Vercel → Project → **Settings** → **Environment Variables**, add:

| Name | Value |
|------|--------|
| `HOUSING_GAS_URL` | Your Housing Google Apps Script URL |
| `SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key from Supabase |
| `VITE_PUBLIC_APP_URL` | `https://YOUR_PROJECT.vercel.app` (set after first deploy) |

Optional: `MAGICBRICKS_GAS_URL`

Apply to **Production**, **Preview**, and **Development**.

### 4. Deploy

Click **Deploy**. When finished, copy your URL (e.g. `https://lead-redirector.vercel.app`).

### 5. Update `VITE_PUBLIC_APP_URL`

Set `VITE_PUBLIC_APP_URL` to your real Vercel URL and **Redeploy** so the dashboard shows correct webhook links.

### 6. Give Housing this URL

```
https://YOUR_PROJECT.vercel.app/api/webhook?source=housing
```

---

## Option B — Vercel CLI (no GitHub)

```powershell
cd "c:\Users\HP\Downloads\lead redirector\dashboard"
npm i -g vercel
vercel login
vercel
```

Follow prompts. Add env vars in the Vercel dashboard or:

```powershell
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add HOUSING_GAS_URL
```

Then:

```powershell
vercel --prod
```

---

## After deploy — quick test

1. Open `https://YOUR_PROJECT.vercel.app`
2. **Test Webhook** → Send test lead
3. Check Supabase **Table Editor** → `leads`
4. Check Housing Google Sheet (if GAS forward works)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Dashboard empty | Add Supabase env vars on Vercel, redeploy |
| Webhook 500 | Check Vercel **Functions** logs |
| API 404 | Ensure `api/` folder is in repo root you deployed |
| Wrong webhook URL on home | Set `VITE_PUBLIC_APP_URL` and redeploy |
