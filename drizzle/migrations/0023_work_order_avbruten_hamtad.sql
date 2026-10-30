ALTER TABLE public.work_orders DROP CONSTRAINT IF EXISTS work_orders_status_check;
ALTER TABLE public.work_orders ADD CONSTRAINT work_orders_status_check CHECK (status IN ('ej_paborjad','paborjad','avbruten','klar','hamtad'));
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS picked_up_at timestamptz;