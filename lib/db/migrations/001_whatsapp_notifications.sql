-- ============================================================================
-- WhatsApp Notifications Schema Migration
-- ============================================================================
-- Run this migration in your Supabase SQL editor to set up the required tables
-- ============================================================================

-- 1. Add whatsapp_number column to pod table
-- ============================================================================
ALTER TABLE public.pod 
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

COMMENT ON COLUMN public.pod.whatsapp_number IS 'WhatsApp number for notifications (with country code, e.g., +1234567890)';

-- 2. Create whatsapp_schedules table
-- ============================================================================
-- Note: Uses pod_name (TEXT) as FK since clients.pod references pod.name
CREATE TABLE IF NOT EXISTS public.whatsapp_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_name TEXT NOT NULL,
  
  -- Schedule configuration
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'custom')),
  time TEXT NOT NULL DEFAULT '09:00', -- 24h format
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  days_of_week INT[] DEFAULT ARRAY[1,2,3,4,5], -- 0=Sun, 6=Sat
  
  -- Message content
  custom_message TEXT NOT NULL DEFAULT 'Please respond to these clients:',
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign key to pod.name
  CONSTRAINT whatsapp_schedules_pod_fkey 
    FOREIGN KEY (pod_name) 
    REFERENCES public.pod(name) 
    ON UPDATE CASCADE 
    ON DELETE CASCADE
);

-- Index for faster queries by pod_name and is_active
CREATE INDEX IF NOT EXISTS idx_whatsapp_schedules_pod_active 
ON public.whatsapp_schedules(pod_name, is_active);

COMMENT ON TABLE public.whatsapp_schedules IS 'Stores scheduled WhatsApp summary configurations for media buyers';

-- 3. Create ad_account_errors table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ad_account_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id BIGINT NOT NULL,
  
  -- Error info
  error_type TEXT NOT NULL, -- 'invalid_token', 'account_disabled', 'rate_limited', etc.
  error_message TEXT,
  
  -- Tracking
  first_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_alerted_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign key to clients
  CONSTRAINT ad_account_errors_client_fkey 
    FOREIGN KEY (client_id) 
    REFERENCES public.clients(id) 
    ON UPDATE CASCADE 
    ON DELETE CASCADE
);

-- Index for faster queries on unresolved errors
CREATE INDEX IF NOT EXISTS idx_ad_account_errors_unresolved 
ON public.ad_account_errors(client_id, is_resolved) 
WHERE is_resolved = false;

-- Index for error type lookups
CREATE INDEX IF NOT EXISTS idx_ad_account_errors_type 
ON public.ad_account_errors(client_id, error_type, is_resolved);

COMMENT ON TABLE public.ad_account_errors IS 'Tracks ad account errors for daily WhatsApp alerts until resolved';

-- 4. Enable Row Level Security (RLS)
-- ============================================================================
ALTER TABLE public.whatsapp_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_account_errors ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Verification Queries (run these to verify the migration)
-- ============================================================================

-- Check pod table has whatsapp_number column:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'pod' AND column_name = 'whatsapp_number';

-- Check whatsapp_schedules table exists:
-- SELECT * FROM whatsapp_schedules LIMIT 1;

-- Check ad_account_errors table exists:
-- SELECT * FROM ad_account_errors LIMIT 1;
