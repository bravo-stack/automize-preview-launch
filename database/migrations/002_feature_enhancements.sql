-- ============================================================================
-- Schema Updates for Full Feature Support
-- ============================================================================
-- Adds: client scoping, compound rules, rule dependencies, notifications
-- ============================================================================

-- ============================================================================
-- 1. ADD CLIENT_ID TO CORE TABLES
-- ============================================================================
-- This allows per-client data storage and Watch Tower rules

ALTER TABLE api_snapshots 
ADD COLUMN client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE api_records 
ADD COLUMN client_id INTEGER;

CREATE INDEX idx_snapshots_client ON api_snapshots(client_id);
CREATE INDEX idx_records_client ON api_records(client_id);

-- ============================================================================
-- 2. UPDATE WATCHTOWER_RULES FOR FLEXIBILITY
-- ============================================================================

-- Make source_id optional (rules can be source-agnostic or table-based)
ALTER TABLE watchtower_rules 
ALTER COLUMN source_id DROP NOT NULL;

-- Add table targeting for comms audit and other tables
ALTER TABLE watchtower_rules 
ADD COLUMN target_table VARCHAR(100),              -- 'api_records', 'communication_reports', 'clients'
ADD COLUMN client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE;  -- Rule can be client-specific

CREATE INDEX idx_rules_client ON watchtower_rules(client_id);
CREATE INDEX idx_rules_target ON watchtower_rules(target_table);

-- ============================================================================
-- 3. COMPOUND RULES (ROAS < X AND Spend > Y)
-- ============================================================================
-- Allows joining multiple conditions into one rule

CREATE TABLE watchtower_rule_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID NOT NULL REFERENCES watchtower_rules(id) ON DELETE CASCADE,
    
    -- Condition details (same structure as in watchtower_rules)
    field_name VARCHAR(100) NOT NULL,
    condition VARCHAR(20) NOT NULL,      -- 'equals', 'greater_than', 'less_than', 'changed', 'contains'
    threshold_value VARCHAR(255),
    
    -- Logical operator with previous condition
    logic_operator VARCHAR(10) DEFAULT 'AND',  -- 'AND', 'OR'
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rule_conditions_rule ON watchtower_rule_conditions(rule_id);

-- ============================================================================
-- 4. RULE DEPENDENCIES
-- ============================================================================
-- Some rules depend on other rules being complete/incomplete

CREATE TABLE watchtower_rule_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID NOT NULL REFERENCES watchtower_rules(id) ON DELETE CASCADE,
    depends_on_rule_id UUID NOT NULL REFERENCES watchtower_rules(id) ON DELETE CASCADE,
    
    -- Dependency type
    dependency_type VARCHAR(20) NOT NULL,  -- 'requires_triggered', 'requires_not_triggered', 'requires_acknowledged'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(rule_id, depends_on_rule_id)
);

CREATE INDEX idx_dependencies_rule ON watchtower_rule_dependencies(rule_id);
CREATE INDEX idx_dependencies_depends ON watchtower_rule_dependencies(depends_on_rule_id);

-- ============================================================================
-- 5. SCHEDULED NOTIFICATIONS
-- ============================================================================

CREATE TABLE watchtower_notification_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID NOT NULL REFERENCES watchtower_rules(id) ON DELETE CASCADE,
    
    -- Schedule configuration
    schedule_type VARCHAR(20) NOT NULL,      -- 'immediate', 'daily', 'weekly', 'custom_cron'
    cron_expression VARCHAR(100),            -- For custom schedules
    notify_time TIME,                        -- Time of day to send (for daily/weekly)
    notify_day_of_week INTEGER,              -- 0-6 for weekly (0 = Sunday)
    
    -- Notification channels
    notify_discord BOOLEAN DEFAULT false,
    notify_email BOOLEAN DEFAULT false,
    discord_channel_id VARCHAR(100),
    email_recipients TEXT[],                 -- Array of email addresses
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_notified_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schedules_rule ON watchtower_notification_schedules(rule_id);
CREATE INDEX idx_schedules_active ON watchtower_notification_schedules(is_active);

CREATE TRIGGER update_notification_schedules_updated_at
    BEFORE UPDATE ON watchtower_notification_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. CVR TRACKING TABLE (for weekly scraper data)
-- ============================================================================

CREATE TABLE client_cvr_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- CVR data
    cvr_value DECIMAL(10,4) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Metadata
    source VARCHAR(50) DEFAULT 'scraper',    -- 'scraper', 'manual', 'api'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One CVR per client per period
    UNIQUE(client_id, period_start, period_end)
);

CREATE INDEX idx_cvr_client ON client_cvr_snapshots(client_id);
CREATE INDEX idx_cvr_period ON client_cvr_snapshots(period_start, period_end);
CREATE INDEX idx_cvr_created ON client_cvr_snapshots(created_at DESC);

-- ============================================================================
-- 7. DATA SOURCE REGISTRY FOR COMMS AUDIT
-- ============================================================================
-- Register communication_reports as a watchable source

INSERT INTO api_sources (provider, endpoint, display_name, description, refresh_interval_minutes)
VALUES 
    ('internal', 'communication_reports', 'Communications Audit', 'Discord communication tracking data', 60),
    ('internal', 'clients', 'Clients', 'Client master data including drop days', 1440),
    ('internal', 'client_cvr', 'Client CVR', 'Weekly CVR snapshots per client', 10080);

-- ============================================================================
-- 8. ALERTS UPDATE - Add client_id for client-specific alerts
-- ============================================================================

ALTER TABLE watchtower_alerts 
ADD COLUMN client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE;

CREATE INDEX idx_alerts_client ON watchtower_alerts(client_id);
