// Staging-only transactional probe. Print for execution through an authorized database connection.
// The transaction rolls back its synthetic users and progress; no existing user records are read.
export const studyProgressRlsProbe = `begin;
do $probe$
declare
  a uuid := pg_catalog.gen_random_uuid();
  b uuid := pg_catalog.gen_random_uuid();
  affected integer;
  blocked boolean;
begin
  insert into auth.users (id, aud, role, email, created_at, updated_at)
  values (a,'authenticated','authenticated','study-probe-a-'||a::text||'@example.invalid',now(),now()),
         (b,'authenticated','authenticated','study-probe-b-'||b::text||'@example.invalid',now(),now());

  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', jsonb_build_object('sub',a::text,'role','authenticated')::text, true);
  insert into army_study_api.army_study_progress(user_id,area,revision,payload)
  values(a,'ew',1,'{"ratings":{"probe":"got-it"},"completed":{}}');

  blocked := false;
  begin
    insert into army_study_api.army_study_progress(user_id,area,revision,payload)
    values(b,'ew',1,'{"ratings":{},"completed":{}}');
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Cross-user insert was not denied'; end if;

  blocked := false;
  begin
    update army_study_api.army_study_progress set user_id=b,revision=2 where user_id=a and area='ew';
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Ownership reassignment was not denied'; end if;

  blocked := false;
  begin
    update army_study_api.army_study_progress set area='acronyms',revision=2 where user_id=a and area='ew';
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Area reassignment was not denied'; end if;

  update army_study_api.army_study_progress set revision=2,payload='{"ratings":{"probe":"review"},"completed":{}}'
  where user_id=a and area='ew' and revision=1;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Owned CAS write failed'; end if;

  update army_study_api.army_study_progress set revision=2,payload='{"ratings":{},"completed":{}}'
  where user_id=a and area='ew' and revision=1;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Stale CAS write succeeded'; end if;

  blocked := false;
  begin
    update army_study_api.army_study_progress set revision=2 where user_id=a and area='ew';
  exception when serialization_failure then blocked := true;
  end;
  if not blocked then raise exception 'Revision guard was bypassed'; end if;

  update army_study_api.army_study_progress set revision=3,payload='{"ratings":{},"completed":{}}',reset=true
  where user_id=a and area='ew' and revision=2;
  if not exists(select 1 from army_study_api.army_study_progress where user_id=a and revision=3 and reset) then
    raise exception 'Reset tombstone missing';
  end if;

  blocked := false;
  begin
    delete from army_study_api.army_study_progress where user_id=a;
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Client delete could erase reset revision'; end if;

  perform set_config('request.jwt.claims', jsonb_build_object('sub',b::text,'role','authenticated')::text, true);
  if exists(select 1 from army_study_api.army_study_progress where user_id=a) then raise exception 'Other user can read owner progress'; end if;
  update army_study_api.army_study_progress set revision=4 where user_id=a;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Other user can update owner progress'; end if;
  insert into army_study_api.army_study_progress(user_id,area,revision,payload)
  values(b,'ew',1,'{"ratings":{"different":"got-it"},"completed":{}}');
  if (select count(*) from army_study_api.army_study_progress) <> 1 then raise exception 'Second user isolation failed'; end if;

  execute 'reset role';
  execute 'set local role anon';
  blocked := false;
  begin
    perform 1 from army_study_api.army_study_progress;
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Anonymous table access was not denied'; end if;
  execute 'reset role';
end;
$probe$;
rollback;
select 'PASS: API view owned reads/writes, two-user isolation, anonymous denial, ownership immutability, stale CAS rejection, revision guard, reset tombstone, client delete denial; probe users and data rolled back' as result;`;

if (process.argv[1]?.endsWith('verify-study-progress-rls.mjs')) console.log(studyProgressRlsProbe);
