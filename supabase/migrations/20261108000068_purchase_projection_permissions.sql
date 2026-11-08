-- Hosted default table privileges also apply to new views. This customer
-- projection must remain SELECT-only regardless of those project defaults.
revoke all on public.my_purchase_orders from public,anon,authenticated,service_role;
grant select on public.my_purchase_orders to authenticated;
