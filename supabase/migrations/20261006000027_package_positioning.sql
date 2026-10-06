-- Align editable catalog descriptions with current website-build positioning.
-- Preserve names, prices, provider links, entitlements and existing order scopes.
-- Only replace known legacy descriptions; retain any separately edited staff copy.
update public.build_prices
set description = 'A polished single-page website from a curated industry design, customized around your brand.'
where kind = 'express'
  and description = 'Pick a template, launch in days.';

update public.build_prices
set description = 'Up to 8 tailored primary pages composed from Vigil premium design systems, with standard booking and third-party integrations.'
where kind = 'professional'
  and description in (
    'Multi-page, custom design.',
    'Up to 8 primary pages, fully custom design, standard booking and third-party integrations.'
  );

update public.build_prices
set description = 'Bespoke visual direction, original components and advanced functionality with an agreed written scope.'
where kind = 'custom'
  and description = 'Quoted separately according to scope.';
