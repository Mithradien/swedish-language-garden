CREATE TABLE public.slot_locks (
  slot_date date NOT NULL,
  slot_time text NOT NULL,
  locked_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (slot_date, slot_time)
);
GRANT SELECT, INSERT, DELETE ON public.slot_locks TO authenticated;
GRANT ALL ON public.slot_locks TO service_role;
ALTER TABLE public.slot_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Personal läser låsta tider" ON public.slot_locks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'superadmin') OR public.has_role(auth.uid(),'useradmin') OR public.has_role(auth.uid(),'mekaniker'));
CREATE POLICY "Admin låser tider" ON public.slot_locks FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'superadmin') OR public.has_role(auth.uid(),'useradmin'));
CREATE POLICY "Admin öppnar tider" ON public.slot_locks FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'superadmin') OR public.has_role(auth.uid(),'useradmin'));