-- A stale editor is an HTTP conflict, not a retryable transaction rollback.
-- Reuse the already validated functions without changing tenancy, ACLs or writes.
do $$
declare target regprocedure; definition text;
begin
 foreach target in array array[
  'public.save_website_content(uuid,integer,jsonb,text,uuid)'::regprocedure,
  'public.save_content_design_workspace(uuid,integer,jsonb,jsonb,uuid,text)'::regprocedure,
  'public.save_website_blog_post(uuid,text,text,text,text,boolean,uuid,timestamp with time zone,jsonb)'::regprocedure,
  'public.set_website_blog_post_deleted(uuid,uuid,timestamp with time zone,boolean)'::regprocedure,
  'public.unpublish_website_blog_post(uuid,uuid,timestamp with time zone)'::regprocedure
 ] loop
  definition := pg_get_functiondef(target);
  if position('40001' in definition)=0 then raise exception 'Expected concurrency guard missing: %',target; end if;
  execute replace(definition,'''40001''','''PT409''');
 end loop;
end$$;
notify pgrst, 'reload schema';
