create type public.giving_suggestion_status as enum (
  'pending',
  'approved',
  'declined'
);

create table public.giving_options (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  unique (household_id, name)
);

create table public.giving_suggestions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  status public.giving_suggestion_status not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.giving_options enable row level security;
alter table public.giving_suggestions enable row level security;

create policy "household members can read giving options"
on public.giving_options
for select
to authenticated
using (
  exists (
    select 1
    from public.household_members member
    where member.household_id = giving_options.household_id
      and member.user_id = auth.uid()
  )
);

create policy "household members can read giving suggestions"
on public.giving_suggestions
for select
to authenticated
using (
  exists (
    select 1
    from public.household_members member
    where member.household_id = giving_suggestions.household_id
      and member.user_id = auth.uid()
  )
);

create function public.suggest_giving_option(
  input_access_code text,
  input_name text
)
returns table (
  id uuid,
  name text,
  status public.giving_suggestion_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  code_row record;
  inserted_suggestion public.giving_suggestions;
begin
  select *
  into code_row
  from public.child_access_codes code
  where code.access_code = regexp_replace(input_access_code, '\D', '', 'g');

  if code_row is null then
    raise exception 'Child access code is invalid.';
  end if;

  insert into public.giving_suggestions (
    household_id,
    child_profile_id,
    name
  )
  values (
    code_row.household_id,
    code_row.child_profile_id,
    trim(input_name)
  )
  returning *
  into inserted_suggestion;

  return query
  select
    inserted_suggestion.id,
    inserted_suggestion.name,
    inserted_suggestion.status;
end;
$$;

create function public.list_child_giving_options(input_access_code text)
returns table (
  id uuid,
  name text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    option.id,
    option.name
  from public.child_access_codes code
  join public.giving_options option
    on option.household_id = code.household_id
  where code.access_code = regexp_replace(input_access_code, '\D', '', 'g')
  order by option.name asc
$$;

create function public.list_household_giving_suggestions(input_household_id uuid)
returns table (
  id uuid,
  name text,
  status public.giving_suggestion_status,
  child_name text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    suggestion.id,
    suggestion.name,
    suggestion.status,
    child.display_name as child_name
  from public.giving_suggestions suggestion
  join public.child_profiles child
    on child.id = suggestion.child_profile_id
  where suggestion.household_id = input_household_id
    and exists (
      select 1
      from public.household_members member
      where member.household_id = suggestion.household_id
        and member.user_id = auth.uid()
        and member.role = 'parent_admin'
    )
  order by suggestion.created_at desc
$$;

create function public.approve_giving_suggestion(
  input_household_id uuid,
  input_suggestion_id uuid
)
returns table (
  id uuid,
  name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  suggestion_row public.giving_suggestions;
  option_row public.giving_options;
begin
  if not exists (
    select 1
    from public.household_members member
    where member.household_id = input_household_id
      and member.user_id = auth.uid()
      and member.role = 'parent_admin'
  ) then
    raise exception 'Parent admin access is required.';
  end if;

  select *
  into suggestion_row
  from public.giving_suggestions suggestion
  where suggestion.id = input_suggestion_id
    and suggestion.household_id = input_household_id
    and suggestion.status = 'pending';

  if suggestion_row is null then
    raise exception 'Giving suggestion is not pending.';
  end if;

  insert into public.giving_options (
    household_id,
    name
  )
  values (
    suggestion_row.household_id,
    suggestion_row.name
  )
  returning *
  into option_row;

  update public.giving_suggestions
  set status = 'approved'
  where giving_suggestions.id = suggestion_row.id;

  return query
  select
    option_row.id,
    option_row.name;
end;
$$;

grant select on public.giving_options to authenticated;
grant select on public.giving_suggestions to authenticated;
grant execute on function public.suggest_giving_option(text, text) to anon, authenticated;
grant execute on function public.list_child_giving_options(text) to anon, authenticated;
grant execute on function public.list_household_giving_suggestions(uuid) to authenticated;
grant execute on function public.approve_giving_suggestion(uuid, uuid) to authenticated;
