-- App schema: products, materials, industries, quotes, ai_predictions.
-- All app rows use uuid for their own id; quotes.estimator_id is TEXT
-- because Better Auth's user.id is TEXT, not uuid.

-- =====================================================================
-- Products: catalog of Marking Systems product categories
-- =====================================================================
create table if not exists products (
  id                    uuid          primary key default gen_random_uuid(),
  category              text          not null,
  name                  text          not null,
  description           text,
  base_price_per_sq_in  numeric(10,4) not null,
  setup_fee             numeric(10,2) not null default 0,
  min_qty               int           not null default 1,
  active                boolean       not null default true,
  created_at            timestamptz   not null default now()
);

-- =====================================================================
-- Materials: substrates, adhesives, overlaminates
-- =====================================================================
create table if not exists materials (
  id                uuid          primary key default gen_random_uuid(),
  type              text          not null,
  name              text          not null,
  description       text,
  cost_per_sq_in    numeric(10,4) not null,
  durability_score  int           not null check (durability_score between 1 and 10),
  active            boolean       not null default true,
  created_at        timestamptz   not null default now()
);

-- =====================================================================
-- Industries served (drives certification premium)
-- =====================================================================
create table if not exists industries (
  id                       uuid          primary key default gen_random_uuid(),
  name                     text          not null unique,
  certification_premium    numeric(4,3)  not null default 1.000,
  required_certifications  text[]        not null default '{}',
  description              text,
  created_at               timestamptz   not null default now()
);

-- =====================================================================
-- Quotes: one row per quote
-- =====================================================================
create table if not exists quotes (
  id                       uuid          primary key default gen_random_uuid(),
  customer_name            text          not null,
  customer_email           text,
  product_id               uuid          not null references products(id),
  material_id              uuid          not null references materials(id),
  industry_id              uuid          not null references industries(id),
  width_inches             numeric(8,3)  not null,
  height_inches            numeric(8,3)  not null,
  quantity                 int           not null check (quantity > 0),
  certifications           text[]        not null default '{}',
  notes                    text,
  status                   text          not null default 'draft'
                                         check (status in ('draft','sent','accepted','declined','expired')),
  base_estimate            numeric(12,2) not null,
  ai_complexity_score      int,
  ai_suggested_price_low   numeric(12,2),
  ai_suggested_price_high  numeric(12,2),
  ai_rationale             text,
  final_price              numeric(12,2),
  estimator_id             text          not null references "user"(id) on delete restrict,
  created_at               timestamptz   not null default now(),
  updated_at               timestamptz   not null default now()
);

create index if not exists idx_quotes_estimator on quotes(estimator_id);
create index if not exists idx_quotes_status on quotes(status);
create index if not exists idx_quotes_created_at on quotes(created_at desc);

-- =====================================================================
-- AI Predictions audit log
-- =====================================================================
create table if not exists ai_predictions (
  id                       uuid          primary key default gen_random_uuid(),
  quote_id                 uuid          references quotes(id) on delete cascade,
  model_used               text          not null,
  prompt_input_hash        text          not null,
  predicted_complexity     int           not null,
  predicted_price_low      numeric(12,2) not null,
  predicted_price_high     numeric(12,2) not null,
  rationale                text          not null,
  latency_ms               int,
  cost_usd                 numeric(8,6),
  feedback                 text,
  created_at               timestamptz   not null default now()
);

create index if not exists idx_ai_predictions_quote on ai_predictions(quote_id);

-- =====================================================================
-- RLS — adapted for Better Auth (not Supabase Auth)
-- Server-side queries use the service_role key which bypasses RLS.
-- Browser-side queries use the anon key which is restricted to
-- read-only access on catalog tables (products, materials, industries).
-- Quotes and ai_predictions are server-only — no anon access.
-- =====================================================================

alter table products       enable row level security;
alter table materials      enable row level security;
alter table industries     enable row level security;
alter table quotes         enable row level security;
alter table ai_predictions enable row level security;

-- Catalog tables: anon can read (public reference data)
create policy "anon can read products"   on products   for select to anon using (true);
create policy "anon can read materials"  on materials  for select to anon using (true);
create policy "anon can read industries" on industries for select to anon using (true);

-- Quotes / ai_predictions: no anon policies. Service role (server) is the
-- only path to read or write these. Better Auth sessions are validated in
-- Next.js route handlers before any service role query runs.

-- updated_at auto-touch on quotes
create or replace function set_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quotes_set_updated_at on quotes;
create trigger quotes_set_updated_at
  before update on quotes
  for each row execute function set_updated_at();
