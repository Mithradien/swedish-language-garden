CREATE TABLE public.work_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_key text NOT NULL UNIQUE,
  regnr text NOT NULL,
  booking_date date NOT NULL,
  service text,
  status text NOT NULL DEFAULT 'ej_paborjad' CHECK (status IN ('ej_paborjad','paborjad','klar')),
  depth_vf numeric(4,1), depth_hf numeric(4,1), depth_vb numeric(4,1), depth_hb numeric(4,1),
  note text,
  mechanic_id uuid,
  started_at timestamptz,
  finished_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.work_orders TO authenticated;
GRANT ALL ON public.work_orders TO service_role;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read work orders" ON public.work_orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'superadmin') OR public.has_role(auth.uid(),'mekaniker'));
CREATE POLICY "Staff create work orders" ON public.work_orders FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'superadmin') OR public.has_role(auth.uid(),'mekaniker'));
CREATE POLICY "Staff update work orders" ON public.work_orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'superadmin') OR public.has_role(auth.uid(),'mekaniker'))
  WITH CHECK (public.has_role(auth.uid(),'superadmin') OR public.has_role(auth.uid(),'mekaniker'));
CREATE INDEX work_orders_date_idx ON public.work_orders (booking_date);