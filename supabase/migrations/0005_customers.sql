-- Customers: lightweight CRM so estimators can quote against a known
-- contact instead of re-typing a name and email every time. Quotes get
-- an optional customer_id FK; existing quotes keep their inline
-- customer_name/customer_email so this rolls forward without a backfill.

create table if not exists customers (
  id            uuid          primary key default gen_random_uuid(),
  name          text          not null,
  email         text,
  company       text,
  phone         text,
  notes         text,
  estimator_id  text          not null references "user"(id) on delete cascade,
  created_at    timestamptz   not null default now(),
  updated_at    timestamptz   not null default now()
);

create index if not exists idx_customers_estimator
  on customers(estimator_id);
create index if not exists idx_customers_estimator_name
  on customers(estimator_id, name);

alter table customers enable row level security;
-- Server-only access (no anon policy). Better Auth sessions are
-- validated in route handlers before service-role queries.

drop trigger if exists customers_set_updated_at on customers;
create trigger customers_set_updated_at
  before update on customers
  for each row execute function set_updated_at();

alter table quotes
  add column if not exists customer_id uuid references customers(id) on delete set null;

create index if not exists idx_quotes_customer on quotes(customer_id);
