-- Ny roll 'skarm' för dedikerade skärmkonton (paddor i kundmottagning/verkstad).
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'skarm';