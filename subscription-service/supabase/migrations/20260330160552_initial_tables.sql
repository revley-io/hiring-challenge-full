-- Checkout processor enum
create type public.checkout_processor as enum ('stripe', 'NMI');

-- Stores
create table public.store (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  checkout_processor public.checkout_processor not null default 'stripe',
  created_at timestamptz not null default now()
);

-- Customers
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  store_id uuid references public.store(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Payment Methods
create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Integrations
create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.store(id) on delete cascade,
  type text not null check (type in ('stripe', 'NMI', 'shopify')),
  status text not null default 'inactive' check (status in ('active', 'inactive')),
  creds jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Transactions
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  created_at timestamptz not null default now()
);
