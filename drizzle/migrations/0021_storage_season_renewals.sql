CREATE TABLE public.storage_renewals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 regnr text NOT NULL,
 season text NOT NULL CHECK (season ~ '^[0-9]{4}-(spring|autumn)$'),
 accepted_name text NOT NULL DEFAULT '',
 terms_snapshot jsonb NOT NULL,
 prices_snapshot jsonb NOT NULL,
 accepted_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id, regnr, season)
);
GRANT SELECT ON public.storage_renewals TO authenticated;
GRANT ALL ON public.storage_renewals TO service_role;
ALTER TABLE public.storage_renewals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers read own renewals and staff read all" ON public.storage_renewals FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE INDEX storage_renewals_regnr_idx ON public.storage_renewals(regnr);