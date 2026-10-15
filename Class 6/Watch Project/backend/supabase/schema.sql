-- Chronos Watch Store Database Schema
-- Run this in your Supabase SQL Editor

create extension if not exists "uuid-ossp";

-- Categories table
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz default now()
);

-- Products table
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  brand text not null,
  description text,
  price decimal(10,2) not null,
  original_price decimal(10,2),
  images text[] default '{}',
  movement_type text not null default 'quartz',
  case_material text not null default 'stainless steel',
  case_size text,
  dial_color text,
  water_resistance text,
  style text not null default 'casual',
  stock integer not null default 0,
  sku text unique,
  featured boolean default false,
  category_id uuid references categories(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User profiles table
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text default 'US',
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Orders table
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  status text not null default 'pending',
  total decimal(10,2) not null,
  shipping_name text not null,
  shipping_email text not null,
  shipping_address text not null,
  shipping_city text not null,
  shipping_state text,
  shipping_postal_code text not null,
  shipping_country text not null default 'US',
  payment_method text default 'mock',
  payment_status text default 'pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order items table
create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  product_brand text not null,
  quantity integer not null default 1,
  price decimal(10,2) not null,
  created_at timestamptz default now()
);

-- Cart items table
create table if not exists cart_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  quantity integer not null default 1,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- Indexes
create index if not exists idx_products_brand on products(brand);
create index if not exists idx_products_style on products(style);
create index if not exists idx_products_movement on products(movement_type);
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_featured on products(featured);
create index if not exists idx_products_price on products(price);
create index if not exists idx_orders_user on orders(user_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_cart_user on cart_items(user_id);

-- Updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_products_updated_at on products;
create trigger update_products_updated_at
  before update on products
  for each row execute function update_updated_at_column();

drop trigger if exists update_orders_updated_at on orders;
create trigger update_orders_updated_at
  before update on orders
  for each row execute function update_updated_at_column();

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Row Level Security
alter table products enable row level security;
alter table categories enable row level security;
alter table profiles enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table cart_items enable row level security;

create policy "Products are viewable by everyone" on products for select using (true);
create policy "Products are insertable by admins" on products for insert with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
create policy "Products are updatable by admins" on products for update using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
create policy "Products are deletable by admins" on products for delete using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

create policy "Categories are viewable by everyone" on categories for select using (true);
create policy "Categories are manageable by admins" on categories for all using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can view own orders" on orders for select using (auth.uid() = user_id);
create policy "Users can create own orders" on orders for insert with check (auth.uid() = user_id);
create policy "Admins can view all orders" on orders for select using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
create policy "Admins can update orders" on orders for update using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

create policy "Users can view own order items" on order_items for select using (exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid()));
create policy "Users can create order items for own orders" on order_items for insert with check (exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid()));
create policy "Admins can manage all order items" on order_items for all using (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

create policy "Users can view own cart" on cart_items for select using (auth.uid() = user_id);
create policy "Users can manage own cart" on cart_items for all using (auth.uid() = user_id);
