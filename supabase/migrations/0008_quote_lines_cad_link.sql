-- Per-line CAD link: each quote_line can optionally point at a cad_uploads
-- row. The AI complexity prompt joins through this to feed path_count as a
-- per-line complexity hint. Nullable so quotes created without a CAD upload
-- (manual dimension entry) keep working.

alter table quote_lines
  add column if not exists cad_upload_id uuid references cad_uploads(id) on delete set null;

create index if not exists idx_quote_lines_cad_upload on quote_lines(cad_upload_id);
