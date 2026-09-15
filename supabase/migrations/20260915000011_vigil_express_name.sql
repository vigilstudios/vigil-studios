-- 0011 Product naming: the Express build is sold as "Vigil Express".
update public.build_prices set name = 'Vigil Express' where kind = 'express' and name = 'Express Site';
