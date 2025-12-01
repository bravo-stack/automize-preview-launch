-- ============================================================================
-- WhatsApp Notifications Schema Migration (Best Practice Version)
-- ============================================================================
-- Run this migration in your Supabase SQL editor
-- ============================================================================

-- 1. Add whatsapp_number column to pod table
-- ============================================================================
-- ALTER TABLE public.pod 
-- ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- COMMENT ON COLUMN public.pod.whatsapp_number 
-- IS 'WhatsApp number for notifications (E.164 format, e.g., +1234567890)';

-- 2. Create whatsapp_schedules table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_name TEXT NOT NULL,

  -- Schedule configuration
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'custom')),

  -- 24-hour time-of-day for sending messages
  time TIME NOT NULL DEFAULT '09:00',

  -- Always store timezone as IANA string — default should be UTC
  timezone TEXT NOT NULL DEFAULT 'UTC',

  -- 0 = Sunday, 6 = Saturday
  days_of_week INT[] DEFAULT ARRAY[1,2,3,4,5],

  -- Message content
  custom_message TEXT NOT NULL DEFAULT 'Please respond to these clients:',

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- FK: pod_name → pod.name
  CONSTRAINT whatsapp_schedules_pod_fkey
    FOREIGN KEY (pod_name)
    REFERENCES public.pod(name)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

COMMENT ON TABLE public.whatsapp_schedules 
IS 'Stores scheduled WhatsApp summary configurations for media buyers';

-- Index for fast lookups by pod_name & active status
CREATE INDEX IF NOT EXISTS idx_whatsapp_schedules_pod_active
ON public.whatsapp_schedules(pod_name, is_active);

-- Index for frequency-based scheduler queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_schedules_frequency
ON public.whatsapp_schedules(frequency);

-- Auto-update updated_at on any update
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS whatsapp_schedules_set_updated_at ON public.whatsapp_schedules;

CREATE TRIGGER whatsapp_schedules_set_updated_at
BEFORE UPDATE ON public.whatsapp_schedules
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- 3. Create ad_account_errors table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ad_account_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id BIGINT NOT NULL,

  -- Error info
  error_type TEXT NOT NULL, 
  error_message TEXT,

  -- Tracking
  first_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_alerted_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  is_resolved BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ad_account_errors_client_fkey
    FOREIGN KEY (client_id)
    REFERENCES public.clients(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

COMMENT ON TABLE public.ad_account_errors 
IS 'Tracks ad account errors for daily WhatsApp alerts until resolved';

-- Efficient queries on unresolved errors
CREATE INDEX IF NOT EXISTS idx_ad_account_errors_unresolved
ON public.ad_account_errors(client_id, is_resolved)
WHERE is_resolved = false;

-- Faster analytics on error types
CREATE INDEX IF NOT EXISTS idx_ad_account_errors_type
ON public.ad_account_errors(client_id, error_type, is_resolved);


-- 4. Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE public.whatsapp_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_account_errors ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- Verification Queries (safe to run manually afterward)
-- ============================================================================
-- SELECT * FROM whatsapp_schedules LIMIT 1;
-- SELECT * FROM ad_account_errors LIMIT 1;
