-- Add onboarding_completed and default_currency fields to user_settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS default_currency text DEFAULT 'AUD';