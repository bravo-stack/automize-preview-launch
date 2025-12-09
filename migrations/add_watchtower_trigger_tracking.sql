-- Migration: Add trigger tracking fields to watchtower_rules table
-- Date: 2024-12-09
-- Description: Adds last_triggered_at and trigger_count columns to track when rules have fired

-- Add last_triggered_at column (nullable timestamp)
ALTER TABLE watchtower_rules
ADD COLUMN IF NOT EXISTS last_triggered_at TIMESTAMPTZ DEFAULT NULL;

-- Add trigger_count column (default to 0)
ALTER TABLE watchtower_rules
ADD COLUMN IF NOT EXISTS trigger_count INTEGER DEFAULT 0 NOT NULL;

-- Create an index on last_triggered_at for efficient querying of recently triggered rules
CREATE INDEX IF NOT EXISTS idx_watchtower_rules_last_triggered_at 
ON watchtower_rules (last_triggered_at DESC NULLS LAST)
WHERE last_triggered_at IS NOT NULL;

-- Comment on new columns for documentation
COMMENT ON COLUMN watchtower_rules.last_triggered_at IS 'Timestamp of when the rule was last triggered (created an alert)';
COMMENT ON COLUMN watchtower_rules.trigger_count IS 'Total number of times this rule has been triggered';
