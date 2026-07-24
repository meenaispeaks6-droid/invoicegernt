
DO $$
DECLARE
  demo_id uuid := '00000000-0000-0000-0000-000000000d3b';
  c1 uuid; c2 uuid; c3 uuid;
  inv uuid;
BEGIN
  -- 1) Create auth user if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = demo_id) THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      demo_id, 'authenticated', 'authenticated', 'demo@billie.app',
      crypt('demo1234', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Demo User"}'::jsonb,
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, provider, identity_data,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), demo_id, demo_id::text, 'email',
      jsonb_build_object('sub', demo_id::text, 'email', 'demo@billie.app', 'email_verified', true),
      now(), now(), now()
    );
  END IF;

  -- 2) Wipe any existing demo workspace data so this migration is idempotent
  DELETE FROM public.invoices WHERE user_id = demo_id;
  DELETE FROM public.clients WHERE user_id = demo_id;

  -- 3) User + business settings (skip onboarding)
  INSERT INTO public.user_settings (user_id, email, first_name, last_name, company_name, onboarding_completed, sample_data_seeded, default_currency)
  VALUES (demo_id, 'demo@billie.app', 'Demo', 'User', 'Billie Studio', true, true, 'USD')
  ON CONFLICT (user_id) DO UPDATE SET
    onboarding_completed = true,
    sample_data_seeded = true,
    default_currency = 'USD',
    company_name = 'Billie Studio';

  INSERT INTO public.business_settings (user_id, company_name, company_email)
  VALUES (demo_id, 'Billie Studio', 'demo@billie.app')
  ON CONFLICT (user_id) DO UPDATE SET
    company_name = 'Billie Studio',
    company_email = 'demo@billie.app';

  -- 4) Clients
  c1 := gen_random_uuid(); c2 := gen_random_uuid(); c3 := gen_random_uuid();

  INSERT INTO public.clients (id, user_id, name, company, email, phone, address, payment_terms, status) VALUES
    (c1, demo_id, 'Olivia Bennett', 'Acme Corp',    'olivia@acmecorp.com',    '+1 (415) 555-0142', '120 Market St, San Francisco, CA 94105',  30, 'active'),
    (c2, demo_id, 'Marcus Hale',    'Stellar Labs', 'marcus@stellarlabs.io',  '+1 (212) 555-0177', '88 Greene St, New York, NY 10012',        14, 'active'),
    (c3, demo_id, 'Sofia Lindqvist','NovaTech',     'sofia@novatech.co',      '+46 8 555 0193',    'Birger Jarlsgatan 24, 114 34 Stockholm',  30, 'active');

  -- 5) Invoices + items
  -- Invoice 1 — PAID, Acme
  inv := gen_random_uuid();
  INSERT INTO public.invoices (id, user_id, client_id, invoice_number, internal_title, status, issue_date, due_date, subtotal, tax_rate, tax_amount, total, notes)
  VALUES (inv, demo_id, c1, 'INV-0001', 'Acme — Q3 brand refresh', 'paid',
          (CURRENT_DATE - INTERVAL '78 days')::date, (CURRENT_DATE - INTERVAL '64 days')::date,
          4800, 0, 0, 4800, 'Thanks for the smooth kickoff.');
  INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES
    (inv, 'Brand strategy workshop (2 days)', 2, 1200, 2400),
    (inv, 'Logo & identity system',           1, 1800, 1800),
    (inv, 'Brand guidelines document',        1,  600,  600);

  -- Invoice 2 — PAID, Stellar
  inv := gen_random_uuid();
  INSERT INTO public.invoices (id, user_id, client_id, invoice_number, internal_title, status, issue_date, due_date, subtotal, tax_rate, tax_amount, total)
  VALUES (inv, demo_id, c2, 'INV-0002', 'Stellar — landing page build', 'paid',
          (CURRENT_DATE - INTERVAL '52 days')::date, (CURRENT_DATE - INTERVAL '38 days')::date,
          3110, 0, 0, 3110);
  INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES
    (inv, 'Landing page design',      1, 1400, 1400),
    (inv, 'Front-end development',   18,   95, 1710);

  -- Invoice 3 — PENDING, NovaTech
  inv := gen_random_uuid();
  INSERT INTO public.invoices (id, user_id, client_id, invoice_number, internal_title, status, issue_date, due_date, subtotal, tax_rate, tax_amount, total)
  VALUES (inv, demo_id, c3, 'INV-0003', 'NovaTech — monthly retainer', 'pending',
          (CURRENT_DATE - INTERVAL '12 days')::date, (CURRENT_DATE + INTERVAL '18 days')::date,
          3280, 0, 0, 3280);
  INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES
    (inv, 'Design retainer — October',            1, 2800, 2800),
    (inv, 'Additional art direction hours',       4,  120,  480);

  -- Invoice 4 — OVERDUE, Acme
  inv := gen_random_uuid();
  INSERT INTO public.invoices (id, user_id, client_id, invoice_number, internal_title, status, issue_date, due_date, subtotal, tax_rate, tax_amount, total, notes)
  VALUES (inv, demo_id, c1, 'INV-0004', 'Acme — campaign assets', 'overdue',
          (CURRENT_DATE - INTERVAL '48 days')::date, (CURRENT_DATE - INTERVAL '27 days')::date,
          2630, 0, 0, 2630, 'Friendly reminder: payment is now past due.');
  INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES
    (inv, 'Social campaign creative (12 assets)', 12, 140, 1680),
    (inv, 'Motion graphics — hero spot',           1, 950,  950);

  -- Invoice 5 — DRAFT, Stellar
  inv := gen_random_uuid();
  INSERT INTO public.invoices (id, user_id, client_id, invoice_number, internal_title, status, issue_date, due_date, subtotal, tax_rate, tax_amount, total)
  VALUES (inv, demo_id, c2, 'INV-0005', 'Stellar — Q4 proposal', 'draft',
          (CURRENT_DATE - INTERVAL '1 day')::date, (CURRENT_DATE + INTERVAL '13 days')::date,
          3390, 0, 0, 3390);
  INSERT INTO public.invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES
    (inv, 'Discovery & scoping',        1, 750,  750),
    (inv, 'Estimated build hours',     24, 110, 2640);
END $$;
