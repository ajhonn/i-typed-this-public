-- Seed schema for the hash receipts ledger table used by the FastAPI backend.
-- This runs in local Supabase when you execute `supabase db reset`.

create table if not exists public.receipts (
  session_id text primary key,
  session_hash text not null,
  hash_version text not null,
  receipt_id text not null,
  metadata text not null,
  created_at text not null
);

create index if not exists idx_receipts_session_hash
  on public.receipts (session_hash);

create index if not exists idx_receipts_receipt_id
  on public.receipts (receipt_id);
