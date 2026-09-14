-- 0010 Billing periods: a plan can be paid monthly, yearly, or for three
-- years at once. interval_count follows the provider's model (Stripe:
-- recurring.interval + interval_count), so "3 years" is year × 3.
-- Amounts are the owner's approved table of 14 Sep 2026; rows, not code.

alter table public.plan_prices add column interval_count integer not null default 1;
alter table public.plan_prices add constraint plan_prices_interval_count_positive check (interval_count >= 1 and interval_count <= 10);
alter table public.plan_prices drop constraint plan_prices_plan_id_currency_interval_key;
alter table public.plan_prices add constraint plan_prices_plan_currency_period_key unique (plan_id, currency, interval, interval_count);

-- Which price the buyer chose; provisioning attributes the subscription to it.
alter table public.orders add column plan_price_id uuid references public.plan_prices (id) on delete set null;

-- Approved prices (USD): monthly / annual / three years.
with approved (code, month_cents, year_cents, three_year_cents) as (
  values
    ('basic',    2900,  29000,  77900),
    ('care',     9900,  99000,  267000),
    ('growth',  19900, 199000,  537000),
    ('priority',39900, 399000, 1077000)
)
insert into public.plan_prices (plan_id, currency, interval, interval_count, amount_cents)
select p.id, 'usd', v.interval, v.count, v.cents
from approved a
join public.plans p on p.code = a.code
cross join lateral (
  values ('month'::public.billing_interval, 1, a.month_cents),
         ('year'::public.billing_interval,  1, a.year_cents),
         ('year'::public.billing_interval,  3, a.three_year_cents)
) as v (interval, count, cents)
on conflict (plan_id, currency, interval, interval_count)
do update set amount_cents = excluded.amount_cents, is_active = true;
