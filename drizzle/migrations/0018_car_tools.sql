CREATE TABLE public.car_notes (
  regnr text PRIMARY KEY,
  note text NOT NULL DEFAULT '',
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.car_notes TO authenticated;
GRANT ALL ON public.car_notes TO service_role;
ALTER TABLE public.car_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Personal läser anteckningar" ON public.car_notes FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Personal skriver anteckningar" ON public.car_notes FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Personal ändrar anteckningar" ON public.car_notes FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.car_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regnr text NOT NULL,
  path text NOT NULL,
  caption text NOT NULL DEFAULT '',
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX car_photos_regnr_idx ON public.car_photos (regnr);
GRANT SELECT, INSERT, DELETE ON public.car_photos TO authenticated;
GRANT ALL ON public.car_photos TO service_role;
ALTER TABLE public.car_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Personal läser bilder" ON public.car_photos FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Personal lägger upp bilder" ON public.car_photos FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND uploaded_by = auth.uid());
CREATE POLICY "Admin tar bort bilder" ON public.car_photos FOR DELETE TO authenticated USING (public.is_admin(auth.uid()) OR uploaded_by = auth.uid());

CREATE TABLE public.wheel_handovers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regnr text NOT NULL,
  lagerplats text NOT NULL DEFAULT '',
  received_by text NOT NULL,
  note text NOT NULL DEFAULT '',
  handed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX wheel_handovers_regnr_idx ON public.wheel_handovers (regnr);
GRANT SELECT, INSERT ON public.wheel_handovers TO authenticated;
GRANT ALL ON public.wheel_handovers TO service_role;
ALTER TABLE public.wheel_handovers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Personal läser kvittenser" ON public.wheel_handovers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Personal kvitterar" ON public.wheel_handovers FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND handed_by = auth.uid());

CREATE POLICY "Personal ändrar lagerplats" ON public.car_storage FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Personal lägger till bil i förvaring" ON public.car_storage FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Personal läser bilfoton" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'car-photos' AND public.is_staff(auth.uid()));
CREATE POLICY "Personal laddar upp bilfoton" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'car-photos' AND public.is_staff(auth.uid()));
CREATE POLICY "Personal tar bort bilfoton" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'car-photos' AND public.is_staff(auth.uid()));