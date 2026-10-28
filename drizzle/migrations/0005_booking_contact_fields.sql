ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS note text;
CREATE INDEX IF NOT EXISTS bookings_date_idx ON public.bookings (booking_date);