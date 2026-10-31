-- Skärmkonton (rollen 'skarm') får läsa – aldrig skriva – det som skärmarna och ankomstkiosken visar.

DROP POLICY "Staff read bookings" ON public.bookings;
CREATE POLICY "Staff read bookings" ON public.bookings FOR SELECT TO authenticated
  USING (is_staff(auth.uid()) OR has_role(auth.uid(), 'skarm'));

CREATE POLICY "Skärmar läser statusar" ON public.booking_statuses FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'skarm'));

DROP POLICY "Staff read screen settings" ON public.app_config;
CREATE POLICY "Staff read screen settings" ON public.app_config FOR SELECT TO authenticated
  USING ((key = 'screens'::text) AND (is_staff(auth.uid()) OR has_role(auth.uid(), 'skarm')));

DROP POLICY "Personal läser plock" ON public.pick_checks;
CREATE POLICY "Personal läser plock" ON public.pick_checks FOR SELECT TO authenticated
  USING (is_staff(auth.uid()) OR has_role(auth.uid(), 'skarm'));

DROP POLICY "Staff read work orders" ON public.work_orders;
CREATE POLICY "Staff read work orders" ON public.work_orders FOR SELECT TO authenticated
  USING (is_staff(auth.uid()) OR has_role(auth.uid(), 'skarm'));

DROP POLICY "Staff read car storage" ON public.car_storage;
CREATE POLICY "Staff read car storage" ON public.car_storage FOR SELECT TO authenticated
  USING (is_staff(auth.uid()) OR has_role(auth.uid(), 'skarm'));

DROP POLICY "Personal läser låsta tider" ON public.slot_locks;
CREATE POLICY "Personal läser låsta tider" ON public.slot_locks FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'useradmin') OR has_role(auth.uid(), 'mekaniker') OR has_role(auth.uid(), 'skarm'));