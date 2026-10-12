-- Explicit, staff-selected sample drafts may be shared in a design preview.
-- Ordinary drafts remain private. No browser table writes or author RPC argument
-- can grant this visibility; production reads always exclude these samples.
alter table public.website_blog_posts add column review_sample boolean not null default false;
alter table public.website_blog_posts add constraint website_blog_sample_is_draft check (not review_sample or status='draft');
create index website_blog_review_samples on public.website_blog_posts(website_id,created_at desc,id) where review_sample;
