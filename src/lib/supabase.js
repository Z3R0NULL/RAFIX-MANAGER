import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Returns null if env vars not configured — app falls back to localStorage only
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// SQL to run in Supabase SQL Editor to create the orders table:
//
// create table if not exists public.orders (
//   id text primary key,
//   order_number text unique not null,
//   data jsonb not null,
//   updated_at timestamptz default now()
// );
//
// -- Allow public read by order_number (for customer tracking)
// alter table public.orders enable row level security;
//
// create policy "Public can read orders by order_number"
//   on public.orders for select
//   using (true);
//
// create policy "Anyone can insert orders"
//   on public.orders for insert
//   with check (true);
//
// create policy "Anyone can update orders"
//   on public.orders for update
//   using (true);
//
// create policy "Anyone can delete orders"
//   on public.orders for delete
//   using (true);
