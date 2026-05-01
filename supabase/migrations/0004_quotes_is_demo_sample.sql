-- Adds an is_demo_sample flag so the daily cleanup cron can preserve the
-- 11 curated seeded quotes while sweeping anything else the demo account
-- creates (or any visitor poking around with the shared demo login).
--
-- Backfill is keyed on the customer_email pattern '*.example' that the seed
-- script uses for every sample row — that's the only place this pattern
-- appears in production.

alter table quotes
  add column if not exists is_demo_sample boolean not null default false;

create index if not exists idx_quotes_is_demo_sample
  on quotes(estimator_id, is_demo_sample, created_at);

update quotes
   set is_demo_sample = true
 where customer_email like '%.example'
   and is_demo_sample = false;
