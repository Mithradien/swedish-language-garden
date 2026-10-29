CREATE TABLE public.customer_cars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  regnr text NOT NULL,
  status text NOT NULL DEFAULT 'kopplad' CHECK (status IN ('kopplad', 'vantar')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, regnr)
);
GRANT SELECT ON public.customer_cars TO authenticated;
GRANT UPDATE ON public.customer_cars TO authenticated;
GRANT ALL ON public.customer_cars TO service_role;
ALTER TABLE public.customer_cars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Egna eller personal läser" ON public.customer_cars FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'mekaniker'));
CREATE POLICY "Superadmin godkänner" ON public.customer_cars FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin')) WITH CHECK (public.has_role(auth.uid(), 'superadmin'));