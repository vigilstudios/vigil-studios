-- Personal Gmail OAuth credentials never enter Auth metadata or browser-readable tables.
create table vigil.gmail_connections (
 user_id uuid primary key references auth.users(id) on delete cascade,
 account_email text not null check (char_length(account_email) between 3 and 254),
 vault_secret_id uuid not null,
 connected_at timestamptz not null default now()
);
alter table vigil.gmail_connections enable row level security;
revoke all on vigil.gmail_connections from public,anon,authenticated,service_role;

create table vigil.gmail_draft_leases (
 user_id uuid not null references auth.users(id) on delete cascade,
 lead_id uuid not null references public.leads(id) on delete cascade,
 lease_token uuid not null,
 lease_until timestamptz not null,
 primary key(user_id,lead_id)
);
alter table vigil.gmail_draft_leases enable row level security;
revoke all on vigil.gmail_draft_leases from public,anon,authenticated,service_role;

create function vigil.gmail_service_only() returns void language plpgsql set search_path='' as $$begin
 if auth.role() is distinct from 'service_role' then raise exception 'Service role only' using errcode='42501';end if;
end$$;
revoke all on function vigil.gmail_service_only() from public,anon,authenticated;
grant execute on function vigil.gmail_service_only() to service_role;

create function public.gmail_connection(p_user uuid,p_credentials boolean default false) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare c vigil.gmail_connections; token text;
begin
 perform vigil.gmail_service_only();
 select * into c from vigil.gmail_connections where user_id=p_user;
 if not found then return null;end if;
 if p_credentials then select decrypted_secret into token from vault.decrypted_secrets where id=c.vault_secret_id;end if;
 return jsonb_build_object('email',c.account_email,'connectedAt',c.connected_at,'refreshToken',token);
end$$;

create function public.save_gmail_connection(p_user uuid,p_email text,p_refresh_token text) returns void
language plpgsql security definer set search_path='' as $$
declare c vigil.gmail_connections; vid uuid;
begin
 perform vigil.gmail_service_only();
 if p_email is null or p_email !~ '^[^[:space:]<>]+@[^[:space:]<>]+\.[^[:space:]<>]+$' or char_length(p_email)>254
 or p_refresh_token is null or char_length(p_refresh_token) not between 10 and 4096 then raise exception 'Invalid Gmail connection';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,50));
 select * into c from vigil.gmail_connections where user_id=p_user for update;
 vid:=c.vault_secret_id;
 if vid is null then select vault.create_secret(p_refresh_token,'vigil.gmail.'||p_user::text,'Personal Gmail reply connection') into vid;
 else perform vault.update_secret(vid,p_refresh_token);end if;
 insert into vigil.gmail_connections(user_id,account_email,vault_secret_id) values(p_user,p_email,vid)
 on conflict(user_id) do update set account_email=excluded.account_email,vault_secret_id=excluded.vault_secret_id,connected_at=now();
 -- Reconnecting must not reuse a draft from the previously linked mailbox.
 delete from public.provider_links where provider='other' and resource_kind='gmail_draft_'||replace(p_user::text,'-','');
 delete from vigil.gmail_draft_leases where user_id=p_user;
end$$;

create function public.remove_gmail_connection(p_user uuid) returns void
language plpgsql security definer set search_path='' as $$
declare vid uuid;
begin
 perform vigil.gmail_service_only();
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,50));
 delete from vigil.gmail_connections where user_id=p_user returning vault_secret_id into vid;
 if vid is not null then delete from vault.secrets where id=vid;end if;
 delete from public.provider_links where provider='other' and resource_kind='gmail_draft_'||replace(p_user::text,'-','');
 delete from vigil.gmail_draft_leases where user_id=p_user;
end$$;

create function public.gmail_draft_lock(p_user uuid,p_lead uuid,p_token uuid,p_release boolean default false) returns boolean
language plpgsql security definer set search_path='' as $$
begin
 perform vigil.gmail_service_only();
 if p_release then
  delete from vigil.gmail_draft_leases where user_id=p_user and lead_id=p_lead and lease_token=p_token;
  return found;
 end if;
 insert into vigil.gmail_draft_leases(user_id,lead_id,lease_token,lease_until) values(p_user,p_lead,p_token,now()+interval '90 seconds')
 on conflict(user_id,lead_id) do update set lease_token=excluded.lease_token,lease_until=excluded.lease_until
 where vigil.gmail_draft_leases.lease_until<now();
 return found;
end$$;

create function public.finish_gmail_draft(p_user uuid,p_lead uuid,p_token uuid,p_connected_at timestamptz,p_draft text,p_thread text) returns boolean
language plpgsql security definer set search_path='' as $$
declare kind text:='gmail_draft_'||replace(p_user::text,'-','');
begin
 perform vigil.gmail_service_only();
 if p_draft !~ '^[a-zA-Z0-9_-]+$' or p_thread !~ '^[a-f0-9]+$' then raise exception 'Invalid draft identity';end if;
 perform 1 from vigil.gmail_connections where user_id=p_user and connected_at=p_connected_at for update;
 if not found then return false;end if;
 perform 1 from vigil.gmail_draft_leases where user_id=p_user and lead_id=p_lead and lease_token=p_token and lease_until>now() for update;
 if not found then return false;end if;
 delete from public.provider_links where provider='other' and resource_kind=kind and entity_type='lead' and entity_id=p_lead;
 insert into public.provider_links(provider,resource_kind,external_id,entity_type,entity_id,metadata)
 values('other',kind,p_draft,'lead',p_lead,jsonb_build_object('thread_id',p_thread));
 return true;
end$$;

create function vigil.cleanup_gmail_connection() returns trigger language plpgsql security definer set search_path='' as $$
begin
 delete from vault.secrets where id=old.vault_secret_id;
 delete from public.provider_links where provider='other' and resource_kind='gmail_draft_'||replace(old.user_id::text,'-','');
 return old;
end$$;
revoke all on function vigil.cleanup_gmail_connection() from public,anon,authenticated,service_role;
create trigger gmail_connection_cleanup after delete on vigil.gmail_connections for each row execute function vigil.cleanup_gmail_connection();

revoke all on function public.gmail_connection(uuid,boolean),public.save_gmail_connection(uuid,text,text),public.remove_gmail_connection(uuid),public.gmail_draft_lock(uuid,uuid,uuid,boolean),public.finish_gmail_draft(uuid,uuid,uuid,timestamptz,text,text) from public,anon,authenticated;
grant execute on function public.gmail_connection(uuid,boolean),public.save_gmail_connection(uuid,text,text),public.remove_gmail_connection(uuid),public.gmail_draft_lock(uuid,uuid,uuid,boolean),public.finish_gmail_draft(uuid,uuid,uuid,timestamptz,text,text) to service_role;
create unique index gmail_draft_per_user_lead on public.provider_links(resource_kind,entity_id)
where provider='other' and entity_type='lead' and resource_kind like 'gmail_draft_%';
