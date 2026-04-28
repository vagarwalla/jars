# Changelog

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
