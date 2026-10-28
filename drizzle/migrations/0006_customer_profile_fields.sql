ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text, ADD COLUMN IF NOT EXISTS street text, ADD COLUMN IF NOT EXISTS postal_code text, ADD COLUMN IF NOT EXISTS city text;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, phone)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'phone');
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'superadmin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'superadmin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'kund');
  END IF;
  RETURN NEW;
END;
$$;