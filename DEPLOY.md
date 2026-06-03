# Due Bill Portal — Deployment Guide

## What you have
A complete React PWA (Progressive Web App) that works as a website AND can be
installed to any phone/tablet home screen like a native app.

---

## Step 1 — Set up Supabase (your database, ~10 min)

1. Go to **supabase.com** → "Start your project" → sign up free
2. Create a new project (name it "duebill-portal", pick your region)
3. Wait ~2 minutes for it to provision
4. Go to **SQL Editor** (left sidebar) → "New query"
5. Open `src/lib/supabase.js` in this project, copy everything between the
   `/* ===` and `=== */` comment blocks — there are TWO blocks (original schema + additions).
   Paste **both** into Supabase SQL Editor and click **Run**
6. Go to **Storage** in Supabase sidebar → create a bucket named exactly `due-bill-images`, set to **Private**
6. Go to **Settings → API** and copy:
   - Project URL  → this is your `VITE_SUPABASE_URL`
   - "anon / public" key → this is your `VITE_SUPABASE_ANON_KEY`

---

## Step 2 — Set up EmailJS (auto-emails, ~5 min)

1. Go to **emailjs.com** → sign up free (200 emails/month free)
2. Go to **Email Services** → Add Service → connect your Gmail or Outlook
3. Copy the **Service ID** (looks like `service_abc123`)
4. Go to **Email Templates** → Create Template for MANAGER APPROVAL:
   - Subject: `Due Bill {{ticket_id}} needs your approval`
   - Body: use the template variables listed in Settings page
5. Create another Template for VENDOR NOTIFICATION
6. Go to **Account → General** → copy your **Public Key**

---

## Step 3 — Deploy to Vercel (your live URL, ~5 min)

1. Go to **github.com** → create a free account if needed
2. Create a **new repository** → upload all these project files
   (or use GitHub Desktop app for easy drag-and-drop)
3. Go to **vercel.com** → sign up free with your GitHub account
4. Click **"Add New Project"** → import your GitHub repo
5. Before clicking Deploy, click **"Environment Variables"** and add:
   ```
   VITE_SUPABASE_URL         = (your Supabase project URL)
   VITE_SUPABASE_ANON_KEY    = (your Supabase anon key)
   VITE_EMAILJS_SERVICE_ID   = (your EmailJS service ID)
   VITE_EMAILJS_MANAGER_TEMPLATE = (manager template ID)
   VITE_EMAILJS_VENDOR_TEMPLATE  = (vendor template ID)
   VITE_EMAILJS_PUBLIC_KEY   = (your EmailJS public key)
   ```
6. Click **Deploy** → in ~2 minutes you'll get a URL like `duebill-portal.vercel.app`

---

## Step 4 — Create your first manager account

1. In Supabase dashboard → **Authentication → Users** → "Invite user"
2. Enter your email → send invite → check email and set password
3. In Supabase → **SQL Editor** → run:
   ```sql
   INSERT INTO profiles (id, full_name, email, role)
   VALUES ('[paste the user UUID from Auth → Users]', 'Your Name', 'your@email.com', 'manager');
   ```
4. Log into your portal at your Vercel URL
5. Go to **Settings** → enter your EmailJS credentials and dealer name
6. Go to **Buckets** → customize your categories and prices
7. Go to **Team & Vendors** → add staff (or create them in Supabase Auth first)

---

## Adding staff / vendors

For each person:
1. Supabase → Authentication → Users → "Invite user" → enter their email
2. They get an email to set their password
3. In Supabase SQL Editor:
   ```sql
   INSERT INTO profiles (id, full_name, email, role, vendor_name)
   VALUES ('[their UUID]', 'John Smith', 'john@vendor.com', 'vendor', 'Smith Glass');
   ```
   Role options: `manager`, `salesperson`, `accounting`, `vendor`

---

## Installing as an app (on phone)

**iPhone/iPad (Safari):** Open your portal URL → tap the Share button →
"Add to Home Screen" → it installs like a native app

**Android (Chrome):** Open your portal URL → tap the 3-dot menu →
"Add to Home Screen" or "Install app"

---

## Costs
- Supabase free tier: up to 50,000 database rows, 500MB storage — more than enough
- Vercel free tier: unlimited deployments, custom domain supported
- EmailJS free tier: 200 emails/month (upgrade to $15/mo for 1,000/month)
- **Total cost to start: $0**

---

## Custom domain (optional, free)
In Vercel → your project → Settings → Domains → add `portal.yourdealership.com`
Then in your DNS provider, add the CNAME record Vercel shows you.
