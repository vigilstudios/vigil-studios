-- Optional booking links use a SQL NULL default; callers can omit the argument.
create or replace function public.configure_website_contact(p_website uuid,p_recipient text,p_booking text default null,p_enabled boolean default null,p_origins text[] default null)
returns void language plpgsql security definer set search_path='' as $$
declare w public.websites; u text; org uuid; origins text[];
begin
 select * into w from public.websites where id=p_website;
 if w.id is null or not (vigil.is_staff() or vigil.has_org_role(w.organization_id,array['owner','manager']::public.org_role[])) then
  raise exception 'Not authorized' using errcode='42501';
 end if;
 if not vigil.is_staff() and (p_enabled is not null or p_origins is not null) then
  raise exception 'Registration requires staff' using errcode='42501';
 end if;
 if p_booking is not null and (p_booking ~* '^https://[^/]*\.(local|internal|test|invalid)(/|$)' or p_booking ~ '^https://[0-9.]+(/|$)' or p_booking !~ '^https://[a-zA-Z0-9.-]+(:443)?(/[^[:space:]]*)?$' or p_booking ~ '^https://(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)') then
  raise exception 'Use a public HTTPS booking URL' using errcode='22023';
 end if;
 if p_origins is not null then
  foreach u in array p_origins loop
   if u !~ '^https://[a-z0-9.-]+(:443)?$' then raise exception 'Invalid origin' using errcode='22023'; end if;
   -- A registered origin must be a verified operated live URL or ready production deployment.
   if not (w.status='live' and split_part(w.live_url,'/',1)||'//'||split_part(w.live_url,'/',3)=u)
     and not exists(select 1 from public.deployments d where d.website_id=w.id and d.status='ready' and d.environment='production'
       and split_part(d.url,'/',1)||'//'||split_part(d.url,'/',3)=u) then
    raise exception 'Origin has no verified production deployment' using errcode='22023';
   end if;
  end loop;
 end if;
 if p_enabled=true and (w.status<>'live' or coalesce(cardinality(p_origins),0)=0) then
  raise exception 'Launch the website and register its origin first' using errcode='22023';
 end if;
 if not vigil.is_staff() and not exists(select 1 from public.website_contact_settings where website_id=w.id) then
  raise exception 'Staff must register this website first' using errcode='22023';
 end if;
 insert into public.website_contact_settings(website_id,organization_id,notification_email,booking_url,enabled,allowed_origins)
 values(w.id,w.organization_id,trim(p_recipient),nullif(trim(p_booking),''),coalesce(p_enabled,false),coalesce(p_origins,'{}'))
 on conflict(website_id) do update set notification_email=excluded.notification_email,booking_url=excluded.booking_url,
  enabled=coalesce(p_enabled,website_contact_settings.enabled),allowed_origins=coalesce(p_origins,website_contact_settings.allowed_origins);
end $$;
