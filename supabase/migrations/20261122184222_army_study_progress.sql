-- Army Study only. Additive, staging-first; no shared Auth/provider changes.
create table public.army_study_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  area text not null check (area in ('phaseup', 'acronyms', 'ew', 'soldier')),
  revision bigint not null default 1 check (revision > 0 and revision <= 9007199254740991),
  payload jsonb not null,
  reset boolean not null default false,
  updated_at timestamptz not null default pg_catalog.now(),
  primary key (user_id, area),
  constraint army_study_progress_payload_shape check (
    jsonb_typeof(payload) = 'object'
    and octet_length(payload::text) <= 1048576
    and case when area = 'phaseup' then
      jsonb_typeof(payload -> 'records') = 'object'
      and jsonb_typeof(payload -> 'events') = 'array'
      and jsonb_typeof(payload -> 'exams') = 'array'
      and payload ?& array['records', 'events', 'exams']
    else
      jsonb_typeof(payload -> 'ratings') = 'object'
      and jsonb_typeof(payload -> 'completed') = 'object'
      and payload ?& array['ratings', 'completed']
    end
  ),
  constraint army_study_progress_reset_empty check (
    not reset or payload = case when area = 'phaseup'
      then '{"records":{},"events":[],"exams":[]}'::jsonb
      else '{"ratings":{},"completed":{}}'::jsonb end
  )
);

alter table public.army_study_progress enable row level security;
revoke all on public.army_study_progress from public, anon, authenticated;
grant select, insert, update on public.army_study_progress to authenticated;

create policy army_study_progress_select on public.army_study_progress
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy army_study_progress_insert on public.army_study_progress
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy army_study_progress_update on public.army_study_progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- A stale expected revision cannot pass even if a client omits its WHERE guard.
-- There is intentionally no client DELETE grant: reset keeps the revision row.
create function public.army_study_progress_revision_guard()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.revision <> 1 then
      raise exception 'Initial progress revision must be one' using errcode = '40001';
    end if;
  else
    if NEW.user_id <> OLD.user_id or NEW.area <> OLD.area then
      raise exception 'Progress ownership and area are immutable' using errcode = '42501';
    end if;
    if NEW.revision <> OLD.revision + 1 then
      raise exception 'Progress revision conflict' using errcode = '40001';
    end if;
  end if;
  NEW.updated_at := pg_catalog.now();
  return NEW;
end;
$$;
revoke all on function public.army_study_progress_revision_guard() from public, anon, authenticated;
create trigger army_study_progress_revision_guard
  before insert or update on public.army_study_progress
  for each row execute function public.army_study_progress_revision_guard();

comment on table public.army_study_progress is
  'Private per-user Army Study snapshots. Clients use revision compare-and-swap; resets retain a revision tombstone.';
