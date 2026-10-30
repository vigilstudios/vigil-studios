-- Seven-year minimum plus explicit filing-date / dispute / audit / ownership holds.
-- This release schedules human retention review; it never automatically deletes evidence.
create table vigil.domain_retention_reviews (
 id uuid primary key default gen_random_uuid(),
 contact_id uuid not null references vigil.domain_contacts(id) on delete restrict,
 statutory_retain_until timestamptz not null,
 filing_anchor_date date not null,
 review_reference text not null check(length(review_reference) between 5 and 1000),
 reviewed_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now(),
 check(statutory_retain_until>=filing_anchor_date::timestamptz)
);
create table vigil.domain_record_holds (
 id uuid primary key default gen_random_uuid(),
 contact_id uuid not null references vigil.domain_contacts(id) on delete restrict,
 reason text not null check(reason in ('audit','dispute','legal','ownership','recordkeeping')),
 reference text not null check(length(reference) between 5 and 1000),
 placed_by uuid not null references auth.users(id) on delete restrict,
 placed_at timestamptz not null default now(),
 released_at timestamptz,
 released_by uuid references auth.users(id) on delete restrict,
 check((released_at is null)=(released_by is null)),
 check(released_at is null or released_at>=placed_at)
);
alter table vigil.domain_retention_reviews enable row level security;
alter table vigil.domain_record_holds enable row level security;
revoke all on vigil.domain_retention_reviews,vigil.domain_record_holds from public,anon,authenticated;
grant select,insert on vigil.domain_retention_reviews to service_role;
grant select,insert,update on vigil.domain_record_holds to service_role;
create trigger domain_retention_reviews_immutable before update or delete on vigil.domain_retention_reviews for each row execute function vigil.domain_record_immutable();
create function vigil.domain_hold_immutable() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='DELETE' then raise exception 'Hold history is retained'; end if;
 if (to_jsonb(new)-array['released_at','released_by']) is distinct from (to_jsonb(old)-array['released_at','released_by']) or old.released_at is not null or new.released_at is null then raise exception 'Only one documented hold release is permitted'; end if;
 return new;
end; $$;
create trigger domain_hold_immutable before update or delete on vigil.domain_record_holds for each row execute function vigil.domain_hold_immutable();
revoke all on function vigil.domain_hold_immutable() from public,anon,authenticated;

create function public.domain_record_review_queue(p_limit integer default 100) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(x) from (select c.id contact_id,c.organization_id,c.created_at,
 greatest(c.created_at+interval '7 years',coalesce((select max(a.accepted_at+make_interval(days=>greatest(2557,coalesce(p.retention_days,2557)))) from public.domain_acceptances a join public.domain_quotes q on q.id=a.quote_id left join vigil.domain_live_policies p on p.id=q.live_policy_id where a.contact_id=c.id),c.created_at+interval '7 years'),coalesce((select max(r.statutory_retain_until) from vigil.domain_retention_reviews r where r.contact_id=c.id),c.created_at+interval '7 years')) retain_until,
 exists(select 1 from vigil.domain_record_holds h where h.contact_id=c.id and h.released_at is null) held,
 exists(select 1 from public.domain_acceptances a join public.domain_orders o on o.acceptance_id=a.id left join public.domain_registrations d on d.id=o.registration_id where a.contact_id=c.id and (coalesce(d.registration_status,'released')<>'released' or o.registration_state not in ('failed','registered') or o.payment_state not in ('paid','refunded','canceled'))) operationally_required,
 exists(select 1 from vigil.domain_retention_reviews r where r.contact_id=c.id) filing_period_reviewed
 from vigil.domain_contacts c where c.created_at<=now()-interval '7 years' order by c.created_at limit least(200,greatest(1,p_limit))) x),'[]'::jsonb);
end; $$;
revoke all on function public.domain_record_review_queue(integer) from public,anon,authenticated;
grant execute on function public.domain_record_review_queue(integer) to service_role;

create function public.domain_operations_health() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if coalesce(auth.role(),'')<>'service_role' then raise exception 'Service access required' using errcode='42501'; end if;
 return jsonb_build_object('taxReportingNeedsReview',(select count(*) from vigil.domain_tax_quotes t join public.domain_orders o on o.quote_id=t.quote_id where t.state='review' or t.failure_code is not null or (o.payment_state in ('paid','refunded') and t.state='uncommitted' and t.created_at<now()-interval '1 hour')),'activeRecordHolds',(select count(*) from vigil.domain_record_holds where released_at is null),'retentionReviewQueue',public.domain_record_review_queue(100));
end; $$;
revoke all on function public.domain_operations_health() from public,anon,authenticated;
grant execute on function public.domain_operations_health() to service_role;
