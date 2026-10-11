-- The guided website finder uses Express, Professional and Growth.
-- Keep the existing custom kind, price ids and quoted purchase workflow.
-- Recurring Vigil Growth remains a separate subscription product.
update public.build_prices
set name = 'Growth Site'
where kind = 'custom' and name = 'Custom Build';
