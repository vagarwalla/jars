create table if not exists jar_users (
  id bigint generated always as identity primary key,
  name text not null unique,
  created_at timestamptz not null default now()
);

alter table jar_users enable row level security;

drop policy if exists "jar_users public read" on jar_users;
create policy "jar_users public read" on jar_users for select to anon using (true);

drop policy if exists "jar_users public insert" on jar_users;
create policy "jar_users public insert" on jar_users for insert to anon with check (true);

insert into jar_users (name) values ('Lily'), ('Jana'), ('Vaidehi')
on conflict (name) do nothing;
