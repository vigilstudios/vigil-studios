-- 0012 Deleting an organization must cascade through its members: the
-- last-owner guard only applies while the organization still exists.
create or replace function vigil.protect_last_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_org uuid := coalesce(old.organization_id, new.organization_id);
  v_owners integer;
begin
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and (new.role <> 'owner' or new.status <> 'active')) then
    if old.role = 'owner' and old.status = 'active' then
      -- The organization is being removed (cascade): nothing to protect.
      if not exists (select 1 from public.organizations o where o.id = v_org) then
        return old;
      end if;
      select count(*) into v_owners
      from public.organization_members m
      where m.organization_id = v_org
        and m.role = 'owner'
        and m.status = 'active'
        and m.user_id <> old.user_id;
      if v_owners = 0 then
        raise exception 'an organization must keep at least one active owner'
          using errcode = '23514';
      end if;
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;
