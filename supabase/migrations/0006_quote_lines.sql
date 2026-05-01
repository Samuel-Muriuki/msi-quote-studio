-- Multi-line items: each quote can have multiple product/material/dimension
-- combinations. Industry, certifications, customer and notes stay per-quote.
-- The aggregate base_estimate column on quotes is kept and is the SUM of
-- line_estimate across all rows.
--
-- For backwards compat the inline product_id/material_id/dimensions/quantity
-- columns on quotes are kept (nullable already? not yet — keeping NOT NULL so
-- existing reads keep working). We backfill one quote_lines row per quote
-- from those inline columns. A follow-up migration will drop the inline
-- columns once the read path everywhere uses quote_lines.

create table if not exists quote_lines (
  id              uuid          primary key default gen_random_uuid(),
  quote_id        uuid          not null references quotes(id) on delete cascade,
  position        int           not null default 0,
  product_id      uuid          not null references products(id),
  material_id    uuid          not null references materials(id),
  width_inches    numeric(8,3)  not null,
  height_inches   numeric(8,3)  not null,
  quantity        int           not null check (quantity > 0),
  line_estimate   numeric(12,2) not null,
  created_at      timestamptz   not null default now()
);

create index if not exists idx_quote_lines_quote_position
  on quote_lines(quote_id, position);

alter table quote_lines enable row level security;
-- Server-only access (no anon policy). Catalog reads stay public via products
-- and materials policies; quote_lines is parent-restricted via the quotes FK.

-- Idempotent backfill: only inserts a line for a quote that has none yet.
insert into quote_lines (quote_id, position, product_id, material_id, width_inches, height_inches, quantity, line_estimate, created_at)
select q.id, 0, q.product_id, q.material_id, q.width_inches, q.height_inches, q.quantity, q.base_estimate, q.created_at
  from quotes q
  left join quote_lines ql on ql.quote_id = q.id
 where ql.id is null;
