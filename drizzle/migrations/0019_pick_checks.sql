CREATE TABLE public.pick_checks (
  booking_key text PRIMARY KEY,
  checked_by uuid,
  checked_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.pick_checks TO authenticated;
GRANT ALL ON public.pick_checks TO service_role;
ALTER TABLE public.pick_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Personal läser plock" ON public.pick_checks FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Personal bockar av" ON public.pick_checks FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND checked_by = auth.uid());
CREATE POLICY "Personal ångrar plock" ON public.pick_checks FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));