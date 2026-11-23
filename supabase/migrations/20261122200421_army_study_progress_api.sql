-- Army Study only. Expose this view through the separately managed staging Data API.
begin;

create schema army_study_api authorization postgres;
revoke all on schema army_study_api from public, anon, authenticated, service_role;

create view army_study_api.army_study_progress
with (security_invoker = true) as
select user_id, area, revision, payload, reset
from public.army_study_progress;

revoke all on table army_study_api.army_study_progress
  from public, anon, authenticated, service_role;

grant usage on schema army_study_api to authenticated;
grant select (user_id, area, revision, payload, reset),
      insert (user_id, area, revision, payload, reset),
      update (revision, payload, reset)
  on table army_study_api.army_study_progress to authenticated;

commit;
