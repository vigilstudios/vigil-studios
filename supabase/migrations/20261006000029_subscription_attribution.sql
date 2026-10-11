-- Checkout provisioning and subscription webhooks may arrive together.
-- Allocate the subscription and canonical provider link in one locked transaction.
create function public.apply_provider_subscription(p_provider public.provider, p_external_id text,
  p_customer_ref text, p_price_ref text, p_snapshot jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare sub uuid; org uuid; price uuid; plan uuid; made boolean := false;
begin
  if p_external_id is null or p_external_id='' then raise exception 'Subscription reference is required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_provider::text||':subscription:'||p_external_id,0));
  select entity_id into sub from public.provider_links where provider=p_provider
    and resource_kind='subscription' and external_id=p_external_id and entity_type='subscription';
  if sub is null then
    select entity_id into org from public.provider_links where provider=p_provider
      and resource_kind='customer' and external_id=p_customer_ref and entity_type='organization';
    select entity_id into price from public.provider_links where provider=p_provider
      and resource_kind='price' and external_id=p_price_ref and entity_type='plan_price';
    if org is null or price is null then return jsonb_build_object('subscriptionId',null,'created',false); end if;
    select plan_id into plan from public.plan_prices where id=price;
    if plan is null then raise exception 'Subscription plan price is missing'; end if;
    insert into public.subscriptions(organization_id,plan_id,plan_price_id) values(org,plan,price) returning id into sub;
    insert into public.provider_links(provider,resource_kind,external_id,entity_type,entity_id)
      values(p_provider,'subscription',p_external_id,'subscription',sub);
    made := true;
  end if;
  update public.subscriptions set status=(p_snapshot->>'status')::public.subscription_status,
    current_period_start=(p_snapshot->>'current_period_start')::timestamptz,
    current_period_end=(p_snapshot->>'current_period_end')::timestamptz,
    cancel_at_period_end=(p_snapshot->>'cancel_at_period_end')::boolean,
    canceled_at=(p_snapshot->>'canceled_at')::timestamptz,
    trial_end=(p_snapshot->>'trial_end')::timestamptz where id=sub;
  if not found then raise exception 'Linked subscription is missing'; end if;
  return jsonb_build_object('subscriptionId',sub,'created',made);
end $$;
revoke all on function public.apply_provider_subscription(public.provider,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.apply_provider_subscription(public.provider,text,text,text,jsonb) to service_role;
