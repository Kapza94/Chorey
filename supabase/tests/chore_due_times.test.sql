begin;

select plan(6);

select has_column('public', 'households', 'timezone', 'households carry a timezone');
select has_column('public', 'chore_templates', 'due_time', 'templates carry a due time');
select has_column('public', 'chore_instances', 'due_at', 'instances carry a due_at');

-- Seed: parent, New-York household, child, two daily templates (one with a 4 PM
-- deadline, one with none).
insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000d01', 'due-parent@example.com');

insert into public.households (id, owner_user_id, name, timezone)
values ('00000000-0000-0000-0000-000000000d02', '00000000-0000-0000-0000-000000000d01', 'Due home', 'America/New_York');

insert into public.household_members (household_id, user_id, role)
values ('00000000-0000-0000-0000-000000000d02', '00000000-0000-0000-0000-000000000d01', 'parent_admin');

insert into public.child_profiles (id, household_id, display_name)
values ('00000000-0000-0000-0000-000000000d03', '00000000-0000-0000-0000-000000000d02', 'Dee');

insert into public.chore_templates (id, household_id, child_profile_id, title, reward_cents, recurrence, due_time, created_by_user_id)
values (
  '00000000-0000-0000-0000-000000000d10',
  '00000000-0000-0000-0000-000000000d02',
  '00000000-0000-0000-0000-000000000d03',
  'Homework', 0, 'daily', '16:00',
  '00000000-0000-0000-0000-000000000d01'
);

insert into public.chore_templates (id, household_id, child_profile_id, title, reward_cents, recurrence, created_by_user_id)
values (
  '00000000-0000-0000-0000-000000000d11',
  '00000000-0000-0000-0000-000000000d02',
  '00000000-0000-0000-0000-000000000d03',
  'Tidy room', 0, 'daily',
  '00000000-0000-0000-0000-000000000d01'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000d01', true);

select is(
  public.ensure_recurring_chore_instances('00000000-0000-0000-0000-000000000d02'),
  2,
  'generation creates an instance for each active template'
);

-- The 4 PM deadline becomes an absolute instant in the household's timezone.
select is(
  (select due_at from public.chore_instances
   where template_id = '00000000-0000-0000-0000-000000000d10'),
  (
    (
      to_char(date_trunc('day', now() at time zone 'utc'), 'YYYY-MM-DD') || ' 16:00'
    )::timestamp
  ) at time zone 'America/New_York',
  'due_at is today 4 PM in the household timezone'
);

select ok(
  (select due_at is null from public.chore_instances
   where template_id = '00000000-0000-0000-0000-000000000d11'),
  'a template with no due_time leaves due_at null'
);

select * from finish();
rollback;
