CREATE OR REPLACE FUNCTION public.is_staff(_u uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_u,'superadmin') OR public.has_role(_u,'useradmin') OR public.has_role(_u,'mekaniker')
$$;
CREATE OR REPLACE FUNCTION public.is_admin(_u uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_u,'superadmin') OR public.has_role(_u,'useradmin')
$$;

DROP POLICY IF EXISTS "Staff read bookings" ON public.bookings;
CREATE POLICY "Staff read bookings" ON public.bookings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Superadmin updates bookings" ON public.bookings;
CREATE POLICY "Superadmin updates bookings" ON public.bookings FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Staff manage statuses" ON public.booking_statuses;
CREATE POLICY "Staff manage statuses" ON public.booking_statuses FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff add events" ON public.status_events;
CREATE POLICY "Staff add events" ON public.status_events FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND actor_id = auth.uid());
DROP POLICY IF EXISTS "Staff read events" ON public.status_events;
CREATE POLICY "Staff read events" ON public.status_events FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff read car storage" ON public.car_storage;
CREATE POLICY "Staff read car storage" ON public.car_storage FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Egna eller personal läser" ON public.customer_cars;
CREATE POLICY "Egna eller personal läser" ON public.customer_cars FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "Superadmin godkänner" ON public.customer_cars;
CREATE POLICY "Superadmin godkänner" ON public.customer_cars FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Staff read work orders" ON public.work_orders;
CREATE POLICY "Staff read work orders" ON public.work_orders FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));