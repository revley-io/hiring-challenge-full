-- seed auth user: merchant1@example.com / password
insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  phone,
  phone_change,
  phone_change_token,
  reauthentication_token
) values (
  '00000000-0000-0000-0000-000000000100',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'merchant1@example.com',
  crypt('password', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"store_id": "00000000-0000-0000-0000-000000000001"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  '',
  '',
  null,
  '',
  '',
  ''
);

insert into auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000100',
  '00000000-0000-0000-0000-000000000100',
  'merchant1@example.com',
  'email',
  '{"sub": "00000000-0000-0000-0000-000000000100", "email": "merchant1@example.com"}'::jsonb,
  now(),
  now(),
  now()
);

-- seed public data
insert into public.store (id, name) values
  ('00000000-0000-0000-0000-000000000001', 'Revley Demo Store');

insert into public.integrations (store_id, type, status, creds) values
  ('00000000-0000-0000-0000-000000000001', 'stripe', 'active', '{"publishable_key": "pk_test_mock", "secret_key": "sk_test_mock"}'),
  ('00000000-0000-0000-0000-000000000001', 'NMI', 'inactive', '{"security_key": "mock_nmi_key"}');

insert into public.customers (id, email, store_id) values
  ('00000000-0000-0000-0000-000000000010', 'alice@example.com', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000011', 'bob@example.com', '00000000-0000-0000-0000-000000000001');
