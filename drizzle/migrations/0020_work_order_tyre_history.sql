ALTER TABLE public.work_orders ADD COLUMN tire_season text, ADD COLUMN fitted_tire_set text;
ALTER TABLE public.work_orders ADD CONSTRAINT work_orders_tire_season_check CHECK (tire_season IN ('summer', 'winter'));
COMMENT ON COLUMN public.work_orders.tire_season IS 'Season of the tyres documented in this work order; never inferred from the visit date.';
COMMENT ON COLUMN public.work_orders.fitted_tire_set IS 'Tyres fitted at this visit, entered by mechanic; retained per visit instead of using current storage data.';