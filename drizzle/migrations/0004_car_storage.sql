CREATE TABLE public.car_storage (
  regnr text PRIMARY KEY,
  modell text NOT NULL DEFAULT '',
  lagerplats text NOT NULL DEFAULT '',
  kundnr text NOT NULL DEFAULT '',
  owner text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  min_depth numeric,
  tires jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.car_storage TO authenticated;
GRANT ALL ON public.car_storage TO service_role;
ALTER TABLE public.car_storage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read car storage" ON public.car_storage FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'mekaniker'));
CREATE POLICY "Superadmin adds car storage" ON public.car_storage FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmin updates car storage" ON public.car_storage FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin')) WITH CHECK (public.has_role(auth.uid(), 'superadmin'));