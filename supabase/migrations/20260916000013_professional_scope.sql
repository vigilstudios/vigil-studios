-- Keep the database-owned checkout description aligned with the approved
-- Professional build boundary. Detailed capabilities live in application
-- configuration; price remains editable in build_prices.
update public.build_prices
set description = 'Up to 8 primary pages, fully custom design, standard booking and third-party integrations.'
where kind = 'professional';
