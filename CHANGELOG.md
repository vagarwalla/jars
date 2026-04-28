# Changelog

## 2026-04-28 — Clickable links + edit suggestions in settings
- URLs in the public suggestions list now render as clickable links (open in new tab); detects `https://`, `http://`, `www.`, and bare domains like `example.com/path`
- Password-gated suggestion management modal now supports editing the text in addition to deleting
- New `PATCH /api/suggestions` (gated by `SETTINGS_PASSWORD` header) updates the suggestion text
- New migration `20260428020000_jar_suggestions_admin_update.sql` adds an RLS UPDATE policy so the PATCH endpoint actually persists (the existing migration only had read/insert/delete)

## 2026-04-28 — Rename "Good Girl Jar" to "Boss Bitch Jar"
- Display label only; internal `good_girl` key preserved so existing rows in `jar_additions` and `jar_suggestions` keep working

## 2026-04-28 — Add custom user names via password-protected settings
- New `jar_users` Supabase table; user list now loaded dynamically (seeded with Lily, Jana, Vaidehi)
- New `/api/users` GET (list) + POST (add, gated by `SETTINGS_PASSWORD` header)
- Settings gear icon next to theme toggle opens a password-protected modal to add new names
- `/api/jars` POST now validates `added_by` against the dynamic user list
- Adds `SETTINGS_PASSWORD` env var (configured in Vercel for production/preview/development)

## 2026-04-28 — Initial release
- Created two mason jar UI (Caveats/Apology Jar + Good Girl Jar)
- Click to add $1, visual fill animation, coin pattern overlay
- Supabase backend logging every addition (jar_name, amount, created_at)
- GET/POST/DELETE API routes for totals, adding, and resetting
- Hidden reset (triple-click) to prevent accidental clears
- Light/dark mode with theme toggle
- Deployed to jars.vaidehiagarwalla.com via Vercel
