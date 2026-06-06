begin;

select plan(8);

select has_table('public', 'chore_templates', 'chore templates table exists');
select has_column('public', 'chore_instances', 'template_id', 'instances link to a template');
select has_column('public', 'chore_instances', 'period_key', 'instances carry a period key');

-- Seed: parent, household, child, one active daily template.
insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000c01', 'rec-parent@example.com');

insert into public.households (id, owner_user_id, name)
values ('00000000-0000-0000-0000-000000000c02', '00000000-0000-0000-0000-000000000c01', 'Recurring home');

insert into public.household_members (household_id, user_id, role)
values ('00000000-0000-0000-0000-000000000c02', '00000000-0000-0000-0000-000000000c01', 'parent_admin');

insert into public.child_profiles (id, household_id, display_name)
values ('00000000-0000-0000-0000-000000000c03', '00000000-0000-0000-0000-000000000c02', 'Remy');

insert into public.chore_templates (id, household_id, child_profile_id, title, reward_cents, recurrence, created_by_user_id)
values (
  '00000000-0000-0000-0000-000000000c10',
  '00000000-0000-0000-0000-000000000c02',
  '00000000-0000-0000-0000-000000000c03',
  'Feed the cat',
  100,
  'daily',
  '00000000-0000-0000-0000-000000000c01'
);

-- Act as the signed-in parent.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000c01', true);

select is(
  public.ensure_recurring_chore_instances('00000000-0000-0000-0000-000000000c02'),
  1,
  'generation creates one instance for the active template'
);

select is(
  (select count(*)::integer from public.chore_instances
   where template_id = '00000000-0000-0000-0000-000000000c10'),
  1,
  'the generated instance is linked to its template'
);

select is(
  public.ensure_recurring_chore_instances('00000000-0000-0000-0000-000000000c02'),
  0,
  'a second run in the same period creates nothing (idempotent)'
);

select is(
  (select period_key from public.chore_instances
   where template_id = '00000000-0000-0000-0000-000000000c10'),
  to_char(date_trunc('day', now() at time zone 'utc'), 'YYYY-MM-DD'),
  'a daily instance is keyed to today (UTC)'
);

-- A non-member gets nothing.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000c09', true);

select is(
  public.ensure_recurring_chore_instances('00000000-0000-0000-0000-000000000c02'),
  0,
  'a non-member generates nothing'
);

select * from finish();
rollback;
