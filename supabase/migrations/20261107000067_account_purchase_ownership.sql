-- Registration is independent of purchase. New purchases are bound to verified Auth IDs.
-- Existing businesses, memberships and legacy orders are not reassigned by email.
alter table public.orders add column buyer_user_id uuid references public.profiles(id) on delete restrict;
create index orders_buyer on public.orders(buyer_user_id,created_at desc) where buyer_user_id is not null;

create function vigil.protect_order_buyer() returns trigger language plpgsql security definer set search_path='' as $$
declare verified_email text;begin
 if tg_op='UPDATE' and old.buyer_user_id is not null and new.buyer_user_id is distinct from old.buyer_user_id then
  raise exception 'Purchase ownership cannot be reassigned' using errcode='23514';
 end if;
 if new.buyer_user_id is not null and (tg_op='INSERT' or old.buyer_user_id is null) then
  select lower(email) into verified_email from auth.users where id=new.buyer_user_id and email_confirmed_at is not null;
  if verified_email is null or new.email<>verified_email then
   raise exception 'Verified account required' using errcode='42501';
  end if;
 end if;
 return new;
end$$;
revoke all on function vigil.protect_order_buyer() from public,anon,authenticated,service_role;
create trigger orders_protect_buyer before insert or update of buyer_user_id on public.orders for each row execute function vigil.protect_order_buyer();

create function public.claim_checkout_order(p_order uuid,p_buyer uuid,p_token text) returns void
language plpgsql security definer set search_path='' as $$
declare o public.orders; verified_email text;begin
 if auth.role() is distinct from 'service_role' then raise exception 'Service only' using errcode='42501';end if;
 select lower(email) into verified_email from auth.users where id=p_buyer and email_confirmed_at is not null;
 if verified_email is null then raise exception 'Verified account required' using errcode='42501';end if;
 select * into o from public.orders where id=p_order and checkout_token=p_token for update;
 if o.id is null or o.status<>'pending' or (o.expires_at is not null and o.expires_at<=now()) then raise exception 'Checkout unavailable' using errcode='22023';end if;
 if (o.buyer_user_id is not null and o.buyer_user_id<>p_buyer) or (o.buyer_user_id is null and o.email<>verified_email) then
  raise exception 'Sign in with the account this order belongs to' using errcode='42501';
 end if;
 if o.organization_id is not null and not exists(select 1 from public.organization_members where organization_id=o.organization_id and user_id=p_buyer and status='active' and role='owner') then
  raise exception 'Business ownership required' using errcode='42501';
 end if;
 update public.orders set buyer_user_id=p_buyer where id=o.id;
end$$;
revoke all on function public.claim_checkout_order(uuid,uuid,text) from public,anon,authenticated,service_role;
grant execute on function public.claim_checkout_order(uuid,uuid,text) to service_role;

-- Public customer DTO: no checkout tokens, provider data, errors, metadata or staff notes.
-- Owner-executed projection deliberately applies the verified Auth ID itself.
create view public.my_purchase_orders with (security_barrier=true) as
 select o.id,o.status,o.business_name,o.project_kind,o.template_slug,o.build_amount_cents,o.plan_amount_cents,o.currency,
 o.organization_id,o.project_id,o.created_at,o.paid_at,o.provisioned_at,p.name as plan_name
 from public.orders o left join public.plans p on p.id=o.plan_id
 where o.buyer_user_id=(select auth.uid());
revoke all on public.my_purchase_orders from public,anon;
grant select on public.my_purchase_orders to authenticated;

-- Reuse the existing atomic allocation boundary for every build kind.
create or replace function public.allocate_order_project(p_order_id uuid,p_slug text,p_provider public.provider,p_customer_ref text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare o public.orders; org uuid; proj uuid; web uuid; created_org boolean:=false;begin
 if auth.role() is distinct from 'service_role' then raise exception 'Service only' using errcode='42501';end if;
 select * into o from public.orders where id=p_order_id for update;
 if o.id is null or o.status not in ('paid','provisioned') then raise exception 'Paid order required' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(coalesce(o.buyer_user_id::text,o.id::text)||':'||lower(btrim(o.business_name)),0));
 org:=o.organization_id;
 if o.buyer_user_id is not null then
  if not exists(select 1 from auth.users where id=o.buyer_user_id and email_confirmed_at is not null) then raise exception 'Verified buyer unavailable' using errcode='42501';end if;
  if org is not null and not exists(select 1 from public.organization_members where organization_id=org and user_id=o.buyer_user_id and role='owner' and status='active') then
   raise exception 'Purchase business ownership mismatch' using errcode='42501';end if;
  if org is null then
   select a.id into org from public.organizations a join public.organization_members m on m.organization_id=a.id
   where m.user_id=o.buyer_user_id and m.role='owner' and m.status='active' and a.archived_at is null and lower(btrim(a.name))=lower(btrim(o.business_name)) order by a.created_at,a.id limit 1;
  end if;
 else
  -- Legacy paid sessions retain provider-backed identity, but never adopt private history by email.
  if org is null and p_customer_ref is not null then
   select entity_id into org from public.provider_links where provider=p_provider and resource_kind='customer' and external_id=p_customer_ref and entity_type='organization';
  end if;
 end if;
 if org is null then
  insert into public.organizations(name,slug,billing_email)
  values(o.business_name,left(coalesce(nullif(regexp_replace(lower(p_slug),'[^a-z0-9-]','','g'),''),'customer'),26)||'-'||replace(o.id::text,'-',''),o.email) returning id into org;
  created_org:=true;
 end if;
 if not exists(select 1 from public.organizations where id=org and archived_at is null) then raise exception 'Business unavailable' using errcode='42501';end if;
 if o.buyer_user_id is not null then
  if created_org then insert into public.organization_members(organization_id,user_id,role,status) values(org,o.buyer_user_id,'owner','active');end if;
 elsif not exists(select 1 from public.organization_invites where organization_id=org and email=o.email and revoked_at is null and expires_at>now())
 and not exists(select 1 from public.organization_members m join public.profiles p on p.id=m.user_id where m.organization_id=org and m.status='active' and p.email=o.email) then
  insert into public.organization_invites(organization_id,email,role,expires_at) values(org,o.email,'owner',now()+interval '90 days');
 end if;
 proj:=o.project_id;
 if proj is null then select id into proj from public.projects where source_ref='order:'||o.id;end if;
 if proj is null then
  insert into public.projects(organization_id,name,kind,status,template_slug,source_ref) values(org,o.business_name||' website',o.project_kind,'intake',o.template_slug,'order:'||o.id) returning id into proj;
 end if;
 if not exists(select 1 from public.projects where id=proj and organization_id=org and kind=o.project_kind) then raise exception 'Purchase project mismatch' using errcode='23514';end if;
 select id into web from public.websites where project_id=proj;
 if web is null then insert into public.websites(organization_id,project_id,name,template_slug,hosting_mode) values(org,proj,o.business_name||' website',o.template_slug,'dedicated') returning id into web;end if;
 if not exists(select 1 from public.websites where id=web and organization_id=org) then raise exception 'Purchase website mismatch' using errcode='23514';end if;
 update public.orders set organization_id=org,project_id=proj where id=o.id;
 return jsonb_build_object('organizationId',org,'projectId',proj,'websiteId',web);
end$$;

-- Profile-backed account directory includes prospects without manufacturing organizations.
create function public.list_customer_accounts(p_filter text default 'all',p_search text default '',p_page integer default 1)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;begin
 if auth.uid() is null or not vigil.is_staff() then raise exception 'Staff required' using errcode='42501';end if;
 if p_filter is null or p_search is null or p_page is null or p_filter not in ('all','no_purchase','purchased','active','pending') or p_page not between 1 and 100000 or length(p_search)>120 then raise exception 'Invalid account filter' using errcode='22023';end if;
 with accounts as (
  select p.id,p.full_name,p.email,p.created_at,u.email_confirmed_at is not null as email_verified,
   (select count(*) from public.orders o where o.status in ('paid','provisioned') and (o.buyer_user_id=p.id or (o.buyer_user_id is null and exists(select 1 from public.organization_members m where m.organization_id=o.organization_id and m.user_id=p.id and m.role='owner' and m.status='active')))) as purchase_count,
   (select count(*) from public.orders o where o.buyer_user_id=p.id and o.status='pending') as pending_count,
   (select count(*) from public.orders o where o.buyer_user_id=p.id and o.status='refunded') as refunded_count,
   (select count(*) from public.websites w where w.status='live' and exists(select 1 from public.organization_members m where m.organization_id=w.organization_id and m.user_id=p.id and m.status='active')) as live_sites,
   coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'name',o.name) order by o.name) from public.organizations o join public.organization_members m on m.organization_id=o.id where m.user_id=p.id and m.status='active' and o.archived_at is null),'[]'::jsonb) as businesses
  from public.profiles p join auth.users u on u.id=p.id
  where not exists(select 1 from public.staff_members s where s.user_id=p.id)
  and (p_search='' or position(lower(btrim(p_search)) in lower(coalesce(p.full_name,'')||' '||p.email))>0)
 ), filtered as (
  select * from accounts where p_filter='all' or (p_filter='no_purchase' and purchase_count=0) or (p_filter='purchased' and purchase_count>0) or (p_filter='active' and live_sites>0) or (p_filter='pending' and pending_count>0)
 )
 select jsonb_build_object('total',(select count(*) from filtered),
  'counts',(select jsonb_build_object('all',count(*),'no_purchase',count(*) filter(where purchase_count=0),'purchased',count(*) filter(where purchase_count>0),'active',count(*) filter(where live_sites>0),'pending',count(*) filter(where pending_count>0)) from accounts),
  'rows',coalesce((select jsonb_agg(to_jsonb(x)) from (select * from filtered order by created_at desc,id limit 25 offset (p_page-1)*25)x),'[]'::jsonb)) into result;
 return result;
end$$;
revoke all on function public.list_customer_accounts(text,text,integer) from public,anon,authenticated,service_role;
grant execute on function public.list_customer_accounts(text,text,integer) to authenticated;
