create table if not exists jar_suggestions (
  id bigint generated always as identity primary key,
  jar_name text not null check (jar_name in ('caveats', 'good_girl')),
  suggestion text not null,
  suggested_by text,
  created_at timestamptz not null default now()
);

create table if not exists jar_suggestion_votes (
  id bigint generated always as identity primary key,
  suggestion_id bigint not null references jar_suggestions(id) on delete cascade,
  voter text not null,
  created_at timestamptz not null default now(),
  unique (suggestion_id, voter)
);

create index if not exists jar_suggestions_jar_name_idx on jar_suggestions (jar_name);
create index if not exists jar_suggestion_votes_suggestion_id_idx on jar_suggestion_votes (suggestion_id);

alter table jar_suggestions enable row level security;
alter table jar_suggestion_votes enable row level security;

-- Suggestions: public read + insert. Delete is gated at the API layer via SETTINGS_PASSWORD.
drop policy if exists "jar_suggestions public read" on jar_suggestions;
create policy "jar_suggestions public read" on jar_suggestions for select to anon using (true);

drop policy if exists "jar_suggestions public insert" on jar_suggestions;
create policy "jar_suggestions public insert" on jar_suggestions for insert to anon with check (true);

drop policy if exists "jar_suggestions admin delete" on jar_suggestions;
create policy "jar_suggestions admin delete" on jar_suggestions for delete to anon using (true);

-- Votes: public read + insert + delete (delete is needed for toggling off an approval).
drop policy if exists "jar_suggestion_votes public read" on jar_suggestion_votes;
create policy "jar_suggestion_votes public read" on jar_suggestion_votes for select to anon using (true);

drop policy if exists "jar_suggestion_votes public insert" on jar_suggestion_votes;
create policy "jar_suggestion_votes public insert" on jar_suggestion_votes for insert to anon with check (true);

drop policy if exists "jar_suggestion_votes public delete" on jar_suggestion_votes;
create policy "jar_suggestion_votes public delete" on jar_suggestion_votes for delete to anon using (true);
