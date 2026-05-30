create table public.child_access_codes (
  child_profile_id uuid primary key references public.child_profiles(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  access_code text not null unique check (access_code ~ '^[0-9]{6}$'),
  created_by_user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.child_access_codes enable row level security;

create policy "parent admins can read child access codes"
on public.child_access_codes
for select
to authenticated
using (
  exists (
    select 1
    from public.household_members member
    where member.household_id = child_access_codes.household_id
      and member.user_id = auth.uid()
      and member.role = 'parent_admin'
  )
);

create policy "parent admins can create child access codes"
on public.child_access_codes
for insert
to authenticated
with check (
  created_by_user_id = auth.uid()
  and exists (
    select 1
    from public.household_members member
    where member.household_id = child_access_codes.household_id
      and member.user_id = auth.uid()
      and member.role = 'parent_admin'
  )
  and exists (
    select 1
    from public.child_profiles child
    where child.id = child_access_codes.child_profile_id
      and child.household_id = child_access_codes.household_id
  )
);

create function public.resolve_child_access_code(input_access_code text)
returns table (
  access_code text,
  child_profile_id uuid,
  child_name text,
  household_id uuid
)
language sql
security definer
set search_path = public
stable
as $$
  select
    code.access_code,
    child.id as child_profile_id,
    child.display_name as child_name,
    code.household_id
  from public.child_access_codes code
  join public.child_profiles child
    on child.id = code.child_profile_id
  where code.access_code = regexp_replace(input_access_code, '\D', '', 'g')
  limit 1
$$;

grant select, insert on public.child_access_codes to authenticated;
grant execute on function public.resolve_child_access_code(text) to anon, authenticated;
