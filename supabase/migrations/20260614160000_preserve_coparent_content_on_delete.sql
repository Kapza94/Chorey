-- Account deletion (delete_my_account) removes the auth user and relies on FK
-- cascades. But chore_instances, chore_templates, and child_access_codes had
-- created_by_user_id -> auth.users ON DELETE CASCADE. So a co-parent deleting
-- THEIR account would also destroy any chores, recurring templates, or access
-- codes they had created in a household they DON'T own — and the ledger_events
-- cascading off those chore instances (children silently lose recorded
-- balances). "Who created this" should never delete a household's content.
--
-- Switch those FKs to ON DELETE SET NULL: deleting a user nulls the attribution
-- but keeps the row. Content in households the deleted user actually OWNED is
-- still removed, because that cascades from the household/child_profile, not
-- from created_by_user_id.

alter table public.chore_instances
  alter column created_by_user_id drop not null,
  drop constraint chore_instances_created_by_user_id_fkey,
  add constraint chore_instances_created_by_user_id_fkey
    foreign key (created_by_user_id) references auth.users(id) on delete set null;

alter table public.chore_templates
  alter column created_by_user_id drop not null,
  drop constraint chore_templates_created_by_user_id_fkey,
  add constraint chore_templates_created_by_user_id_fkey
    foreign key (created_by_user_id) references auth.users(id) on delete set null;

alter table public.child_access_codes
  alter column created_by_user_id drop not null,
  drop constraint child_access_codes_created_by_user_id_fkey,
  add constraint child_access_codes_created_by_user_id_fkey
    foreign key (created_by_user_id) references auth.users(id) on delete set null;
