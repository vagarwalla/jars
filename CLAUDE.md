# Jars - jars.vaidehiagarwalla.com

A simple web app with two money jars: "Caveats / Apology Jar" and "Good Girl Jar". Click to add $1 to either jar.

## Architecture
- **Framework**: Next.js (App Router) with TypeScript + Tailwind CSS
- **Backend**: Supabase (shared project `xkwiugwafgcmcwlyzawq` / `bookbundle`)
- **Hosting**: Vercel, domain `jars.vaidehiagarwalla.com`
- **Database tables**:
  - `jar_additions` — every individual addition (`jar_name`, `amount`, `added_by`, `created_at`)
  - `jar_users` — selectable names (seeded with Lily, Jana, Vaidehi; new names added via password-protected settings)

## Key Decisions
- $1 per click (fixed amount)
- Global state — no auth, one shared set of jars for everyone
- User selector tracks who added each dollar; default users are Lily, Jana, Vaidehi; selection persisted in localStorage. Additional names can be added from a password-protected settings modal (gear icon, top right)
- All additions are logged individually for future analytics (amount, date, jar, added_by)
- Reset is hidden: triple-click the barely-visible "reset" text below each jar
- Mason jar visual fills up as money is added (100% full at $100)
- Light/dark mode with theme toggle, preference stored in localStorage

## Database Schema
```sql
CREATE TABLE jar_additions (
  id bigint generated always as identity primary key,
  jar_name text not null check (jar_name in ('caveats', 'good_girl')),
  amount integer not null default 1,
  added_by text,
  created_at timestamptz not null default now()
);

CREATE TABLE jar_users (
  id bigint generated always as identity primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);
```
RLS enabled with public read/insert/delete policies for anon role on `jar_additions`, and public read/insert on `jar_users`.

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SETTINGS_PASSWORD` — gates `POST /api/users` (header `x-settings-password`); set in keychain as `jars-settings-password`

## File Structure
- `src/app/page.tsx` — Main UI with jar components, theme toggle, settings modal
- `src/app/api/jars/route.ts` — GET (totals), POST (add), DELETE (reset) endpoints
- `src/app/api/users/route.ts` — GET (list users), POST (add user, password-gated)
- `src/lib/supabase.ts` — Supabase client singleton
