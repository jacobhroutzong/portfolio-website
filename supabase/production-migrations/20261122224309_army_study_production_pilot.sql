-- Army Study production pilot. Apply only to the approved production project.
-- The existing staging migrations and all API exposure settings are separate.
begin;

create schema army_study_private;
revoke all on schema army_study_private from public, anon, authenticated, service_role;

create table army_study_private.pilot_members (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table army_study_private.army_study_progress (
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

alter table army_study_private.pilot_members enable row level security;
alter table army_study_private.army_study_progress enable row level security;
revoke all on army_study_private.pilot_members, army_study_private.army_study_progress
  from public, anon, authenticated, service_role;

-- The progress policy can read only the caller's own membership.
-- Private schema USAGE and enrollment remain with the database owner.
grant select (user_id) on army_study_private.pilot_members to authenticated;
create policy army_study_pilot_members_select on army_study_private.pilot_members
  for select to authenticated using ((select auth.uid()) = user_id);

grant select (user_id, area, revision, payload, reset),
      insert (user_id, area, revision, payload, reset),
      update (revision, payload, reset)
  on army_study_private.army_study_progress to authenticated;

create policy army_study_pilot_own_progress on army_study_private.army_study_progress
  for all to authenticated
  using (
    (select auth.uid()) = user_id
    and (select exists (
      select 1 from army_study_private.pilot_members where user_id = (select auth.uid())
    ))
  )
  with check (
    (select auth.uid()) = user_id
    and (select exists (
      select 1 from army_study_private.pilot_members where user_id = (select auth.uid())
    ))
  );

-- Preserve the reviewed staging revision and immutable ownership rules.
create function army_study_private.army_study_progress_revision_guard()
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
revoke all on function army_study_private.army_study_progress_revision_guard() from public, anon, authenticated, service_role;
create trigger army_study_progress_revision_guard
  before insert or update on army_study_private.army_study_progress
  for each row execute function army_study_private.army_study_progress_revision_guard();

create schema army_study_api;
revoke all on schema army_study_api from public, anon, authenticated, service_role;

create view army_study_api.army_study_progress
with (security_invoker = true) as
select user_id, area, revision, payload, reset
from army_study_private.army_study_progress;

revoke all on army_study_api.army_study_progress from public, anon, authenticated, service_role;
grant usage on schema army_study_api to authenticated;
grant select (user_id, area, revision, payload, reset),
      insert (user_id, area, revision, payload, reset),
      update (revision, payload, reset)
  on army_study_api.army_study_progress to authenticated;

commit;
