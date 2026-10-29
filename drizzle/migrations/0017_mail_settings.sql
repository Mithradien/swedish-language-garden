CREATE TABLE public.mail_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  host text NOT NULL DEFAULT '',
  port int NOT NULL DEFAULT 587,
  username text NOT NULL DEFAULT '',
  password text NOT NULL DEFAULT '',
  from_address text NOT NULL DEFAULT '',
  site_url text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.mail_settings TO authenticated;
GRANT ALL ON public.mail_settings TO service_role;
ALTER TABLE public.mail_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmin manages mail settings" ON public.mail_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin')) WITH CHECK (public.has_role(auth.uid(), 'superadmin'));