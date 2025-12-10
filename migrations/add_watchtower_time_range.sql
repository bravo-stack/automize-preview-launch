-- Migration: Add time_range field to watchtower_rules table
-- This allows rules to be triggered based on data from specific time periods
-- Options: 'today', 'last_7_days', 'last_30_days', 'last_90_days', 'all_time'

ALTER TABLE watchtower_rules
ADD COLUMN IF NOT EXISTS time_range VARCHAR(20) DEFAULT 'all_time';

-- Add comment for documentation
COMMENT ON COLUMN watchtower_rules.time_range IS 'Time range filter for rule evaluation: today, last_7_days, last_30_days, last_90_days, all_time';

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_watchtower_rules_time_range 
ON watchtower_rules (time_range);
