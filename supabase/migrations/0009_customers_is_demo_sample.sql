-- Mirror the quotes pattern: is_demo_sample on customers so the 48-hour
-- cleanup cron knows which rows are curated samples (kept forever) vs
-- ad-hoc demo entries (swept). Existing customers are tagged as samples
-- so the populated /customers page survives the first cron run.

alter table customers
  add column if not exists is_demo_sample boolean not null default false;

create index if not exists idx_customers_is_demo_sample
  on customers(estimator_id, is_demo_sample, created_at);

-- Tag everything that exists right now as a sample.
update customers set is_demo_sample = true where is_demo_sample = false;
