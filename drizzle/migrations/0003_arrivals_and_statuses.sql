CREATE TABLE public.booking_statuses (
  booking_key text PRIMARY KEY,
  status text NOT NULL CHECK (status IN ('vantas','ankommen','ej','avbokad')),
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_statuses TO authenticated;
GRANT ALL ON public.booking_statuses TO service_role;
ALTER TABLE public.booking_statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage statuses" ON public.booking_statuses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'superadmin') OR public.has_role(auth.uid(),'mekaniker'))
  WITH CHECK (public.has_role(auth.uid(),'superadmin') OR public.has_role(auth.uid(),'mekaniker'));

-- Full history: every status change incl. kiosk arrivals and resets, never overwritten.
CREATE TABLE public.status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_key text NOT NULL,
  regnr text NOT NULL,
  status text NOT NULL,
  source text NOT NULL DEFAULT 'personal',
  actor_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.status_events TO authenticated;
GRANT ALL ON public.status_events TO service_role;
ALTER TABLE public.status_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read events" ON public.status_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'superadmin') OR public.has_role(auth.uid(),'mekaniker'));
CREATE POLICY "Staff add events" ON public.status_events FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(),'superadmin') OR public.has_role(auth.uid(),'mekaniker')) AND actor_id = auth.uid());
CREATE INDEX status_events_key_idx ON public.status_events (booking_key);