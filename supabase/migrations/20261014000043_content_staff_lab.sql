-- Preserve Vigil's existing staff-only website delivery workflow for Basic builds.
-- Customer Hub access and upload reservations still require Care; Express never qualifies.
do $$
declare source text; guard text := 'not vigil.content_access(c.website_id)';
begin
 source := pg_get_functiondef('public.save_website_content(uuid,integer,jsonb,text,uuid)'::regprocedure);
 if position(guard in source)=0 then raise exception 'Expected collection authorization guard missing';end if;
 execute replace(source,guard,'(not vigil.content_access(c.website_id) and not (exists(select 1 from public.staff_members staff where staff.user_id=p_actor) and public.website_content_delivery(c.website_id,true)))');
end$$;
notify pgrst, 'reload schema';
