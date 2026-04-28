-- Admin edit support: PATCH /api/suggestions is gated by SETTINGS_PASSWORD at
-- the API layer; this opens RLS so the anon-keyed update from that endpoint
-- can succeed. Without this, edits silently no-op.
drop policy if exists "jar_suggestions admin update" on jar_suggestions;
create policy "jar_suggestions admin update" on jar_suggestions for update to anon using (true) with check (true);
