alter table public.feedback
  drop column if exists service,
  drop column if exists branch,
  drop column if exists comment,
  drop column if exists device;
