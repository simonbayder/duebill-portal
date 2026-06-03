import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

/* ============================================================
   SUPABASE SCHEMA — run this in your Supabase SQL editor
   ============================================================

-- PROFILES (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  role text not null check (role in ('manager','salesperson','accounting','vendor')),
  vendor_name text,
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Managers can read all profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'manager')
);
create policy "Managers can insert profiles" on profiles for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'manager')
);
create policy "Managers can update profiles" on profiles for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'manager')
);

-- BUCKETS (customizable categories)
create table buckets (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  default_price numeric(10,2) default 0,
  description text,
  active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);
alter table buckets enable row level security;
create policy "All authenticated users can read buckets" on buckets for select using (auth.role() = 'authenticated');
create policy "Managers can manage buckets" on buckets for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('manager','accounting'))
);

-- Insert default buckets
insert into buckets (name, default_price, sort_order) values
  ('Accessories', 250.00, 1),
  ('Upfits', 1200.00, 2),
  ('Paint Touch Up', 350.00, 3),
  ('Bumper Repair', 450.00, 4),
  ('Windshield Repair/Replace', 300.00, 5),
  ('Window Tint', 275.00, 6);

-- SETTINGS
create table settings (
  id int primary key default 1 check (id = 1),
  dealer_name text default 'Dealership',
  default_tax_rate numeric(5,4) default 0.0875,
  manager_email text,
  service_email text,
  accounting_email text,
  emailjs_service_id text,
  emailjs_manager_template text,
  emailjs_vendor_template text,
  emailjs_public_key text,
  updated_at timestamptz default now()
);
alter table settings enable row level security;
create policy "All authenticated read settings" on settings for select using (auth.role() = 'authenticated');
create policy "Managers update settings" on settings for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('manager','accounting'))
);
insert into settings (id) values (1);

-- DUE BILLS
create table due_bills (
  id uuid default gen_random_uuid() primary key,
  bill_number text unique not null,
  status text not null default 'draft' check (status in ('draft','pending_approval','approved','rejected','in_progress','completed','closed')),
  customer_name text not null,
  customer_email text,
  customer_phone text,
  customer_address text,
  customer_city text,
  customer_state text,
  customer_zip text,
  vehicle_year text,
  vehicle_make text,
  vehicle_model text,
  vehicle_vin text,
  vehicle_stock text,
  vehicle_color text,
  sale_date date,
  salesperson_id uuid references profiles(id),
  salesperson_name text,
  manager_id uuid references profiles(id),
  notes text,
  tax_rate numeric(5,4),
  rejection_reason text,
  approved_at timestamptz,
  approved_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table due_bills enable row level security;
create policy "Salespeople see own bills" on due_bills for select using (
  salesperson_id = auth.uid() or
  exists (select 1 from profiles where id = auth.uid() and role in ('manager','accounting'))
);
create policy "Salespeople create bills" on due_bills for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role in ('salesperson','manager'))
);
create policy "Managers update bills" on due_bills for update using (
  exists (select 1 from profiles where id = auth.uid() and role in ('manager','accounting'))
  or salesperson_id = auth.uid()
);

-- DUE BILL LINE ITEMS
create table due_bill_items (
  id uuid default gen_random_uuid() primary key,
  due_bill_id uuid references due_bills(id) on delete cascade,
  bucket_id uuid references buckets(id),
  bucket_name text not null,
  description text not null,
  is_internal boolean default false,
  estimated_price numeric(10,2) default 0,
  final_price numeric(10,2),
  vendor_id uuid references profiles(id),
  vendor_name text,
  vendor_email text,
  status text default 'pending' check (status in ('pending','assigned','in_progress','completed')),
  notes text,
  completed_at timestamptz,
  created_at timestamptz default now()
);
alter table due_bill_items enable row level security;
create policy "Read items based on bill access" on due_bill_items for select using (
  exists (
    select 1 from due_bills db
    where db.id = due_bill_id and (
      db.salesperson_id = auth.uid() or
      exists (select 1 from profiles where id = auth.uid() and role in ('manager','accounting'))
    )
  )
  or vendor_id = auth.uid()
);
create policy "Vendors can update their items" on due_bill_items for update using (
  vendor_id = auth.uid() or
  exists (select 1 from profiles where id = auth.uid() and role in ('manager','accounting'))
);
create policy "Managers insert items" on due_bill_items for insert with check (auth.role() = 'authenticated');

-- AUTO-INCREMENT bill number
create sequence bill_number_seq start 1000;
create or replace function generate_bill_number()
returns trigger as $$
begin
  new.bill_number := 'DB-' || lpad(nextval('bill_number_seq')::text, 5, '0');
  return new;
end;
$$ language plpgsql;
create trigger set_bill_number before insert on due_bills
  for each row execute function generate_bill_number();

-- Updated at trigger
create or replace function update_updated_at()
returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;
create trigger due_bills_updated_at before update on due_bills
  for each row execute function update_updated_at();

============================================================ */

/* ============================================================
   SCHEMA ADDITIONS — run these in Supabase SQL Editor
   ============================================================

-- Add cost & sold price columns to due_bill_items
alter table due_bill_items
  add column if not exists cost_price numeric(10,2) default 0,
  add column if not exists sold_price numeric(10,2) default 0;

-- Due bill images table (max 2 per bill)
create table if not exists due_bill_images (
  id uuid default gen_random_uuid() primary key,
  due_bill_id uuid references due_bills(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  file_name text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);
alter table due_bill_images enable row level security;
create policy "Authenticated users can read images" on due_bill_images
  for select using (auth.role() = 'authenticated');
create policy "Internal staff can insert images" on due_bill_images
  for insert with check (auth.role() = 'authenticated');
create policy "Managers can delete images" on due_bill_images
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and role in ('manager','accounting'))
    or uploaded_by = auth.uid()
  );

-- Signatures table
create table if not exists due_bill_signatures (
  id uuid default gen_random_uuid() primary key,
  due_bill_id uuid references due_bills(id) on delete cascade unique,
  signature_data_url text not null,
  signed_by_name text,
  signed_at timestamptz default now(),
  ip_address text
);
alter table due_bill_signatures enable row level security;
create policy "Authenticated users read signatures" on due_bill_signatures
  for select using (auth.role() = 'authenticated');
create policy "Anyone can insert signature" on due_bill_signatures
  for insert with check (true);

-- Supabase Storage bucket for images (run in Supabase dashboard Storage tab)
-- Create a bucket called "due-bill-images" set to private
-- Then add this storage policy in SQL:
insert into storage.buckets (id, name, public) values ('due-bill-images', 'due-bill-images', false)
  on conflict do nothing;
create policy "Auth users can upload images" on storage.objects
  for insert with check (bucket_id = 'due-bill-images' and auth.role() = 'authenticated');
create policy "Auth users can read images" on storage.objects
  for select using (bucket_id = 'due-bill-images' and auth.role() = 'authenticated');
create policy "Uploaders can delete images" on storage.objects
  for delete using (bucket_id = 'due-bill-images' and auth.role() = 'authenticated');

============================================================ */
