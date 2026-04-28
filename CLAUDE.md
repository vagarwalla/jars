# Jars - jars.vaidehiagarwalla.com

A simple web app with two money jars: "Caveats / Apology Jar" and "Good Girl Jar". Click to add $1 to either jar.

## Architecture
- **Framework**: Next.js (App Router) with TypeScript + Tailwind CSS
- **Backend**: Supabase (shared project `xkwiugwafgcmcwlyzawq` / `bookbundle`)
- **Hosting**: Vercel, domain `jars.vaidehiagarwalla.com`
- **Database table**: `jar_additions` — stores every individual addition with `jar_name`, `amount`, `created_at`

## Key Decisions
- $1 per click (fixed amount)
- Global state — no auth, one shared set of jars for everyone
- All additions are logged individually for future analytics (amount, date, jar)
- Reset is hidden: triple-click the barely-visible "reset" text below each jar
- Mason jar visual fills up as money is added (100% full at $100)
- Light/dark mode with theme toggle, preference stored in localStorage

## Database Schema
```sql
CREATE TABLE jar_additions (
  id bigint generated always as identity primary key,
  jar_name text not null check (jar_name in ('caveats', 'good_girl')),
  amount integer not null default 1,
  created_at timestamptz not null default now()
);
```
RLS enabled with public read/insert/delete policies for anon role.

## Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key

## File Structure
- `src/app/page.tsx` — Main UI with jar components, theme toggle
- `src/app/api/jars/route.ts` — GET (totals), POST (add), DELETE (reset) endpoints
- `src/lib/supabase.ts` — Supabase client singleton
