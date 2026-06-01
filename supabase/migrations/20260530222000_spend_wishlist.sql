create type public.wishlist_item_status as enum (
  'active',
  'requested',
  'purchased'
);

create type public.purchase_request_status as enum (
  'pending',
  'approved',
  'declined'
);

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  target_cents integer not null check (target_cents > 0),
  status public.wishlist_item_status not null default 'active',
  created_at timestamptz not null default now()
);

create table public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  child_profile_id uuid not null references public.child_profiles(id) on delete cascade,
  wishlist_item_id uuid not null references public.wishlist_items(id) on delete cascade,
  status public.purchase_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (wishlist_item_id)
);

alter table public.ledger_events
  alter column chore_instance_id drop not null;

alter table public.ledger_events
  drop constraint ledger_events_amount_cents_check;

alter table public.ledger_events
  add constraint ledger_events_amount_cents_check check (amount_cents <> 0);

alter table public.ledger_events
  add column purchase_request_id uuid references public.purchase_requests(id) on delete cascade;

alter table public.ledger_events
  add constraint ledger_events_has_source check (
    chore_instance_id is not null
    or purchase_request_id is not null
  );

alter table public.wishlist_items enable row level security;
alter table public.purchase_requests enable row level security;

create policy "household members can read wishlist items"
on public.wishlist_items
for select
to authenticated
using (
  exists (
    select 1
    from public.household_members member
    where member.household_id = wishlist_items.household_id
      and member.user_id = auth.uid()
  )
);

create policy "household members can read purchase requests"
on public.purchase_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.household_members member
    where member.household_id = purchase_requests.household_id
      and member.user_id = auth.uid()
  )
);

create function public.list_child_wishlist_items(input_access_code text)
returns table (
  id uuid,
  name text,
  target_cents integer,
  status public.wishlist_item_status
)
language sql
security definer
set search_path = public
stable
as $$
  select
    item.id,
    item.name,
    item.target_cents,
    item.status
  from public.child_access_codes code
  join public.wishlist_items item
    on item.child_profile_id = code.child_profile_id
  where code.access_code = regexp_replace(input_access_code, '\D', '', 'g')
  order by item.created_at desc
$$;

create function public.create_child_wishlist_item(
  input_access_code text,
  input_name text,
  input_target_cents integer
)
returns table (
  id uuid,
  name text,
  target_cents integer,
  status public.wishlist_item_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  code_row record;
  inserted_item public.wishlist_items;
begin
  select *
  into code_row
  from public.child_access_codes code
  where code.access_code = regexp_replace(input_access_code, '\D', '', 'g');

  if code_row is null then
    raise exception 'Child access code is invalid.';
  end if;

  insert into public.wishlist_items (
    household_id,
    child_profile_id,
    name,
    target_cents
  )
  values (
    code_row.household_id,
    code_row.child_profile_id,
    trim(input_name),
    input_target_cents
  )
  returning *
  into inserted_item;

  return query
  select
    inserted_item.id,
    inserted_item.name,
    inserted_item.target_cents,
    inserted_item.status;
end;
$$;

create function public.request_wishlist_purchase(
  input_access_code text,
  input_wishlist_item_id uuid
)
returns table (
  id uuid,
  wishlist_item_id uuid,
  status public.purchase_request_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  code_row record;
  item_row public.wishlist_items;
  spend_balance_cents integer;
  inserted_request public.purchase_requests;
begin
  select *
  into code_row
  from public.child_access_codes code
  where code.access_code = regexp_replace(input_access_code, '\D', '', 'g');

  if code_row is null then
    raise exception 'Child access code is invalid.';
  end if;

  select *
  into item_row
  from public.wishlist_items item
  where item.id = input_wishlist_item_id
    and item.child_profile_id = code_row.child_profile_id
    and item.status = 'active';

  if item_row is null then
    raise exception 'Wishlist item is not active.';
  end if;

  select coalesce(sum(ledger.amount_cents), 0)::integer
  into spend_balance_cents
  from public.ledger_events ledger
  where ledger.child_profile_id = code_row.child_profile_id
    and ledger.bucket = 'spend';

  if spend_balance_cents < item_row.target_cents then
    raise exception 'Spend balance is too low.';
  end if;

  insert into public.purchase_requests (
    household_id,
    child_profile_id,
    wishlist_item_id
  )
  values (
    item_row.household_id,
    item_row.child_profile_id,
    item_row.id
  )
  returning *
  into inserted_request;

  update public.wishlist_items
  set status = 'requested'
  where wishlist_items.id = item_row.id;

  return query
  select
    inserted_request.id,
    inserted_request.wishlist_item_id,
    inserted_request.status;
end;
$$;

create function public.list_household_purchase_requests(input_household_id uuid)
returns table (
  id uuid,
  wishlist_item_id uuid,
  item_name text,
  target_cents integer,
  child_name text,
  status public.purchase_request_status
)
language sql
security definer
set search_path = public
stable
as $$
  select
    request.id,
    request.wishlist_item_id,
    item.name as item_name,
    item.target_cents,
    child.display_name as child_name,
    request.status
  from public.purchase_requests request
  join public.wishlist_items item
    on item.id = request.wishlist_item_id
  join public.child_profiles child
    on child.id = request.child_profile_id
  where request.household_id = input_household_id
    and exists (
      select 1
      from public.household_members member
      where member.household_id = request.household_id
        and member.user_id = auth.uid()
        and member.role = 'parent_admin'
    )
  order by request.created_at desc
$$;

create function public.approve_purchase_request(
  input_household_id uuid,
  input_request_id uuid
)
returns table (
  id uuid,
  wishlist_item_id uuid,
  status public.purchase_request_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.purchase_requests;
  item_row public.wishlist_items;
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
  into request_row
  from public.purchase_requests request
  where request.id = input_request_id
    and request.household_id = input_household_id
    and request.status = 'pending';

  if request_row is null then
    raise exception 'Purchase request is not pending.';
  end if;

  select *
  into item_row
  from public.wishlist_items item
  where item.id = request_row.wishlist_item_id;

  update public.purchase_requests
  set status = 'approved'
  where purchase_requests.id = request_row.id
  returning *
  into request_row;

  update public.wishlist_items
  set status = 'purchased'
  where wishlist_items.id = item_row.id;

  insert into public.ledger_events (
    household_id,
    child_profile_id,
    purchase_request_id,
    bucket,
    amount_cents
  )
  values (
    request_row.household_id,
    request_row.child_profile_id,
    request_row.id,
    'spend',
    -item_row.target_cents
  );

  return query
  select
    request_row.id,
    request_row.wishlist_item_id,
    request_row.status;
end;
$$;

grant select on public.wishlist_items to authenticated;
grant select on public.purchase_requests to authenticated;
grant execute on function public.list_child_wishlist_items(text) to anon, authenticated;
grant execute on function public.create_child_wishlist_item(text, text, integer) to anon, authenticated;
grant execute on function public.request_wishlist_purchase(text, uuid) to anon, authenticated;
grant execute on function public.list_household_purchase_requests(uuid) to authenticated;
grant execute on function public.approve_purchase_request(uuid, uuid) to authenticated;
