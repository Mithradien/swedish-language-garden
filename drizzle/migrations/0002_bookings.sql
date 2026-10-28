CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_key text NOT NULL UNIQUE,
  regnr text NOT NULL,
  name text,
  phone text,
  booking_date date NOT NULL,
  start_time text NOT NULL,
  end_time text,
  service text,
  source text NOT NULL DEFAULT 'csv',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read bookings" ON public.bookings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'superadmin') OR public.has_role(auth.uid(),'mekaniker'));
CREATE POLICY "Superadmin adds bookings" ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'superadmin'));
CREATE POLICY "Superadmin updates bookings" ON public.bookings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'superadmin')) WITH CHECK (public.has_role(auth.uid(),'superadmin'));
CREATE INDEX bookings_date_idx ON public.bookings (booking_date);