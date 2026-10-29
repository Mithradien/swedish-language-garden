CREATE TABLE public.app_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_config TO anon, authenticated;
GRANT INSERT, UPDATE ON public.app_config TO authenticated;
GRANT ALL ON public.app_config TO service_role;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Alla kan läsa schema" ON public.app_config FOR SELECT TO anon, authenticated USING (key = 'schedule');
CREATE POLICY "Superadmin skapar" ON public.app_config FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmin ändrar" ON public.app_config FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'superadmin')) WITH CHECK (public.has_role(auth.uid(), 'superadmin'));