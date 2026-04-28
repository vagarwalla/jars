-- Admin edit support: PATCH /api/jars/additions is gated by SETTINGS_PASSWORD
-- at the API layer; this opens RLS so the anon-keyed update from that endpoint
-- can persist. Without this, edits silently no-op.
drop policy if exists "jar_additions admin update" on jar_additions;
create policy "jar_additions admin update" on jar_additions for update to anon using (true) with check (true);
