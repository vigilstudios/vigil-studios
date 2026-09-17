-- Sites already launched before the Express approval gate are grandfathered
-- as approved. Preview-only projects remain awaiting a customer decision.

insert into public.project_review_responses (
  organization_id, project_id, round_id, submission_id, kind, feedback
)
select r.organization_id, r.project_id, r.id, r.current_submission_id, 'approved',
       'Grandfathered because this Express site was already live before preview approval was introduced.'
from public.project_review_rounds r
join public.projects p on p.id = r.project_id and p.kind = 'express'
join public.websites w on w.project_id = p.id and w.status = 'live' and w.live_url is not null
where r.round_number = 1
  and r.status = 'awaiting_feedback'
  and r.current_submission_id is not null
  and not exists (
    select 1 from public.project_review_responses response
     where response.submission_id = r.current_submission_id
  );

update public.notifications n
   set read_at = coalesce(n.read_at, now())
 where n.kind = 'website.preview_ready'
   and exists (
     select 1
       from public.websites w
       join public.projects p on p.id = w.project_id and p.kind = 'express'
      where w.organization_id = n.organization_id
        and w.status = 'live'
        and w.live_url is not null
   );
