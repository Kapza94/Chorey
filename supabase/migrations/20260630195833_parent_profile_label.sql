-- Let parents choose what children see in note threads: Mom, Dad, Parent, etc.

alter table public.profiles
  add column if not exists parent_label text;

create or replace function public.add_parent_wish_note(
  input_wishlist_item_id uuid,
  input_body text
)
returns table (
  id uuid,
  author_kind text,
  author_name text,
  body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  item_row public.wishlist_items;
  parent_name text;
  inserted public.wish_notes;
begin
  select item.*
  into item_row
  from public.wishlist_items item
  join public.household_members member
    on member.household_id = item.household_id
  where item.id = input_wishlist_item_id
    and member.user_id = auth.uid()
    and member.role = 'parent_admin';

  if item_row is null then
    raise exception 'Wish not found or not in your household.';
  end if;

  if length(trim(coalesce(input_body, ''))) = 0 then
    raise exception 'A note cannot be empty.';
  end if;

  select coalesce(nullif(trim(profile.parent_label), ''), nullif(trim(profile.display_name), ''), '')
  into parent_name
  from public.profiles profile
  where profile.id = auth.uid();

  insert into public.wish_notes (wishlist_item_id, household_id, author_kind, author_name, body)
  values (item_row.id, item_row.household_id, 'parent', coalesce(parent_name, ''), trim(input_body))
  returning * into inserted;

  update public.wishlist_items item
  set parent_notes_seen_at = now()
  where item.id = item_row.id;

  id := inserted.id;
  author_kind := inserted.author_kind;
  author_name := inserted.author_name;
  body := inserted.body;
  created_at := inserted.created_at;
  return next;
end;
$$;

revoke execute on function public.add_parent_wish_note(uuid, text) from public, anon;
grant execute on function public.add_parent_wish_note(uuid, text) to authenticated;
