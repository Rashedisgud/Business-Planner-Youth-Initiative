# Setup

This is a plain Node.js + React app, so it runs the same way on Windows, macOS, and Linux — the only requirement is Node.js 18+ and npm. Everything below works from PowerShell, cmd, or a Unix shell.

## 1. Install dependencies

From the `BYI` folder:

```bash
npm install
```

This installs the root, `backend/`, and `frontend/` workspaces together.

## 2. Create your accounts and collect keys

You need two free accounts:

1. **OpenAI** — https://platform.openai.com/api-keys → create a secret key.
2. **Supabase** — https://supabase.com → New project → wait for it to provision.
   - In the SQL editor, run the contents of [`supabase/schema.sql`](supabase/schema.sql) to create all the app's tables (`sessions`, `founder`, `reviews`). This file is safe to re-run any time (it only creates things that don't already exist) — if new tables get added later, just re-run the whole file again instead of hunting for what's new.
   - In Project Settings → API, copy the **Project URL** and the **service_role** key (not the anon key — the backend needs full access) for `backend/.env`.
   - Also copy the **anon / publishable** key (a different key, safe to expose in frontend code) for `frontend/.env`.
   - Nothing else to do here — the backend automatically creates its own `founder-photos` storage bucket the first time it starts up.
   - Sign-up emails: by default Supabase requires users to click a confirmation link before they can sign in. That's fine as-is for testing (or for real use with a configured email provider) — no setup needed unless you want to turn it off, which you can do in Authentication → Providers → Email.

## 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

(On Windows PowerShell, use `Copy-Item backend\.env.example backend\.env` and `Copy-Item frontend\.env.example frontend\.env` instead.)

Fill in the blanks in `backend/.env` with the keys from step 2. Also set `ADMIN_PASSWORD` to a password of your own choosing — this is not an external account, just a secret you pick; whoever knows it can edit the "About the founder" section from the running app, so keep it private and don't reuse a password from anywhere else. `frontend/.env` needs `VITE_API_URL` (defaults to `http://localhost:4000`, rarely needs changing locally) plus `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from step 2, which power sign-in.

## 4. Run it

```bash
npm run dev
```

This starts the backend on `http://localhost:4000` and the frontend on `http://localhost:5173` together. Open the frontend URL in a browser.

If you'd rather run them in separate terminals: `npm run dev:backend` and `npm run dev:frontend`.

## 5. About the founder section

Click **"About the founder"** in the header to see (and, once you've entered your `ADMIN_PASSWORD`, edit) a name/photo/bio block shown to everyone using the app. Only someone who knows `ADMIN_PASSWORD` can change it — click the pencil/edit button, enter the password once, and it's remembered on that device for next time (click "Not you? Clear saved password" to forget it, e.g. on a shared computer).

## 6. Accounts and plan history

Users can optionally sign up/sign in (email + password, via Supabase Auth) from the "Sign in" link in the header. This is entirely additive, not required - every stage of the app is free and works with no account at all. Signing in just adds **My plans**: every business plan started while signed in is saved to that account and listed under "My plans," with a Resume button, so people can pick up where they left off across devices.

One known limitation: if someone starts a plan anonymously and signs in partway through, that already-started plan stays anonymous (it won't retroactively appear in "My plans") - only plans created after signing in are tied to the account.

## Deploying to a real domain

The app is two pieces that deploy separately: a static frontend and a Node backend. Config files for both are already in the repo (`frontend/vercel.json`, `render.yaml`), so most of this is clicking through dashboards rather than writing anything.

Do these in order — each step needs the URL from the one before it.

### 1. Put the code on GitHub

Both hosts deploy from a Git repo. Create an empty repo on github.com, then from the `BYI` folder:

```bash
git init && git add . && git commit -m "Initial commit"
```

Then follow the "push an existing repository" commands GitHub shows you. `.gitignore` already excludes `.env`, so your API keys will **not** be uploaded — but do double-check that `backend/.env` is not listed when you run `git status`.

### 2. Deploy the backend (Render — free tier)

1. render.com → sign up → **New → Blueprint** → connect your GitHub repo.
2. Render reads [`render.yaml`](render.yaml) and sets up the service automatically.
3. When prompted, paste the secret values (the same ones in your local `backend/.env`): `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`.
4. For `FRONTEND_URL`, put a placeholder for now (e.g. `https://example.com`) — you'll correct it in step 5.
5. Deploy, then copy the service URL Render gives you, e.g. `https://bpyi-backend.onrender.com`.

> Note: Render's free tier sleeps after ~15 minutes of inactivity, so the first visit after a quiet period takes ~30 seconds to wake up. Fine for launch; upgrade later if that becomes annoying.

### 3. Deploy the frontend (Vercel — free tier)

1. vercel.com → sign up → **Add New → Project** → import the same repo.
2. Set **Root Directory** to `frontend`. (Everything else is auto-detected from `vercel.json`.)
3. Add these Environment Variables:
   - `VITE_API_URL` = the Render URL from step 2
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon/publishable key
4. Deploy. You'll get a working `*.vercel.app` URL — the site is live at this point, even before the custom domain.

### 4. Buy and connect the domain

1. Buy `bpyi.org` from any registrar (Namecheap, Cloudflare, GoDaddy, etc.). You have to do this part yourself — it needs your payment details. Expect roughly $10-15/year for a `.org`.
2. In Vercel: **Project → Settings → Domains → Add**, enter `bpyi.org`.
3. Vercel shows you the exact DNS records to create. Add them at your registrar:
   - Apex domain (`bpyi.org`) → usually an **A record** to Vercel's IP
   - `www` → usually a **CNAME** to `cname.vercel-dns.com`
4. Wait for DNS to propagate (minutes to a few hours). Vercel issues the HTTPS certificate automatically.

### 5. Point the backend at the real domain (don't skip this)

Back in Render → your service → Environment, set `FRONTEND_URL` to every hostname the site is reachable on, comma-separated, with no trailing slashes:

```
https://bpyi.org,https://www.bpyi.org
```

Then redeploy. **If you skip this, the site will load but every request will fail** — the backend rejects browser requests from origins it doesn't recognise. If that happens you'll see a clear error: *"This site is not allowed to call the API. Check FRONTEND_URL on the backend."*

### 6. Update Supabase auth URLs

Supabase → Authentication → URL Configuration → set **Site URL** to `https://bpyi.org` and add it under **Redirect URLs**. Without this, sign-up confirmation emails will link back to localhost.

### Post-launch checklist

- [ ] Visit the domain over `https://` and complete one full plan end to end
- [ ] Download the PDF and open it
- [ ] Visit `/#admin` and confirm your password unlocks it
- [ ] Test on a phone, not just a desktop browser
