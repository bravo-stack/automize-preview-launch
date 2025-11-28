-- ============================================================================
-- API Response Storage & Watch Tower Schema
-- ============================================================================
-- Enterprise-grade schema for storing external API data and monitoring
-- Supports: per-client scoping, time comparisons, compound rules, dependencies
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. API_SOURCES - Registry of data sources/endpoints
-- ============================================================================
CREATE TABLE api_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Source identification
    provider VARCHAR(50) NOT NULL,          -- 'omnisend', 'shopify', 'scraper', 'internal'
    endpoint VARCHAR(100) NOT NULL,         -- 'campaigns', 'automations', 'cvr'
    
    -- Configuration
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    refresh_interval_minutes INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(provider, endpoint)
);

-- ============================================================================
-- 2. API_SNAPSHOTS - Point-in-time captures for comparison
-- ============================================================================
CREATE TABLE api_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES api_sources(id) ON DELETE CASCADE,
    client_id INTEGER,                      -- Per-client data scoping
    
    -- Snapshot metadata
    snapshot_type VARCHAR(20) DEFAULT 'scheduled',  -- 'scheduled', 'manual', 'triggered'
    total_records INTEGER DEFAULT 0,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending',   -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_snapshots_source ON api_snapshots(source_id);
CREATE INDEX idx_snapshots_client ON api_snapshots(client_id);
CREATE INDEX idx_snapshots_created ON api_snapshots(created_at DESC);
CREATE INDEX idx_snapshots_status ON api_snapshots(status);

-- ============================================================================
-- 3. API_RECORDS - Individual records from API responses
-- ============================================================================
CREATE TABLE api_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES api_snapshots(id) ON DELETE CASCADE,
    client_id INTEGER,                      -- Per-client data scoping
    
    -- Universal identifiers
    external_id VARCHAR(255) NOT NULL,      -- ID from the external API
    
    -- Common fields (mapped per provider)
    name VARCHAR(255),
    email VARCHAR(255),
    status VARCHAR(50),
    category VARCHAR(100),
    tags TEXT[],
    
    -- Numeric fields
    amount DECIMAL(15,4),
    quantity INTEGER,
    
    -- Temporal
    record_date TIMESTAMPTZ,
    
    -- Overflow for unmapped fields (rare edge cases only)
    extra JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_records_snapshot ON api_records(snapshot_id);
CREATE INDEX idx_records_client ON api_records(client_id);
CREATE INDEX idx_records_external ON api_records(external_id);
CREATE INDEX idx_records_status ON api_records(status);
CREATE INDEX idx_records_email ON api_records(email);
CREATE INDEX idx_records_category ON api_records(category);
CREATE INDEX idx_records_date ON api_records(record_date);

-- ============================================================================
-- 4. API_RECORD_METRICS - M2M table for flexible named metrics
-- ============================================================================
CREATE TABLE api_record_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL REFERENCES api_records(id) ON DELETE CASCADE,
    
    -- Metric identification
    metric_name VARCHAR(100) NOT NULL,      -- 'open_rate', 'click_rate', 'cvr', 'roas'
    metric_value DECIMAL(20,6) NOT NULL,
    
    -- Optional metadata
    metric_unit VARCHAR(20),                -- 'percent', 'currency', 'count'
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate metrics per record
    UNIQUE(record_id, metric_name)
);

CREATE INDEX idx_metrics_record ON api_record_metrics(record_id);
CREATE INDEX idx_metrics_name ON api_record_metrics(metric_name);
CREATE INDEX idx_metrics_name_value ON api_record_metrics(metric_name, metric_value);

-- ============================================================================
-- 5. METRIC_DEFINITIONS - Registry of known metrics (for UI/validation)
-- ============================================================================
CREATE TABLE metric_definitions (
    metric_name VARCHAR(100) PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    metric_unit VARCHAR(20),
    min_value DECIMAL(20,6),
    max_value DECIMAL(20,6),
    provider VARCHAR(50),                   -- Which provider uses this, null = universal
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. WATCHTOWER_RULES - Surveillance configuration
-- ============================================================================
CREATE TABLE watchtower_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Targeting (at least one should be set)
    source_id UUID REFERENCES api_sources(id) ON DELETE CASCADE,
    client_id INTEGER,                              -- Rule can be client-specific
    target_table VARCHAR(100),                      -- 'api_records', 'communication_reports', 'clients'
    
    -- Rule definition
    name VARCHAR(100) NOT NULL,
    description TEXT,
    field_name VARCHAR(100) NOT NULL,               -- 'status', 'amount', 'open_rate', etc.
    condition VARCHAR(20) NOT NULL,                 -- 'equals', 'greater_than', 'less_than', 'changed', 'contains'
    threshold_value VARCHAR(255),
    
    -- Rule dependencies (self-referential)
    parent_rule_id UUID REFERENCES watchtower_rules(id) ON DELETE SET NULL,
    dependency_condition VARCHAR(30),               -- 'triggered', 'not_triggered', 'acknowledged'
    
    -- Compound rules (multiple conditions grouped)
    logic_operator VARCHAR(10) DEFAULT 'AND',       -- 'AND', 'OR'
    group_id UUID,                                  -- Groups conditions together
    
    -- Alerting
    severity VARCHAR(20) DEFAULT 'warning',         -- 'info', 'warning', 'critical'
    is_active BOOLEAN DEFAULT true,
    
    -- Notification settings (embedded)
    notify_immediately BOOLEAN DEFAULT true,
    notify_schedule VARCHAR(20),                    -- 'daily', 'weekly'
    notify_time TIME,
    notify_day_of_week INTEGER,                     -- 0-6 (0 = Sunday)
    notify_discord BOOLEAN DEFAULT false,
    notify_email BOOLEAN DEFAULT false,
    discord_channel_id VARCHAR(100),
    email_recipients TEXT[],
    last_notified_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rules_source ON watchtower_rules(source_id);
CREATE INDEX idx_rules_client ON watchtower_rules(client_id);
CREATE INDEX idx_rules_target ON watchtower_rules(target_table);
CREATE INDEX idx_rules_parent ON watchtower_rules(parent_rule_id);
CREATE INDEX idx_rules_group ON watchtower_rules(group_id);
CREATE INDEX idx_rules_active ON watchtower_rules(is_active);

-- ============================================================================
-- 7. WATCHTOWER_ALERTS - Generated alerts
-- ============================================================================
CREATE TABLE watchtower_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID NOT NULL REFERENCES watchtower_rules(id) ON DELETE CASCADE,
    snapshot_id UUID NOT NULL REFERENCES api_snapshots(id) ON DELETE CASCADE,
    record_id UUID REFERENCES api_records(id) ON DELETE SET NULL,
    client_id INTEGER,                              -- Per-client alerts
    
    -- Alert details
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    current_value VARCHAR(255),
    previous_value VARCHAR(255),
    
    -- Status
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_rule ON watchtower_alerts(rule_id);
CREATE INDEX idx_alerts_snapshot ON watchtower_alerts(snapshot_id);
CREATE INDEX idx_alerts_client ON watchtower_alerts(client_id);
CREATE INDEX idx_alerts_unacknowledged ON watchtower_alerts(is_acknowledged) WHERE NOT is_acknowledged;
CREATE INDEX idx_alerts_severity ON watchtower_alerts(severity);
CREATE INDEX idx_alerts_created ON watchtower_alerts(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_api_sources_updated_at
    BEFORE UPDATE ON api_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watchtower_rules_updated_at
    BEFORE UPDATE ON watchtower_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Common metrics
INSERT INTO metric_definitions (metric_name, display_name, description, metric_unit, provider) VALUES
    ('open_rate', 'Open Rate', 'Email open rate percentage', 'percent', null),
    ('click_rate', 'Click Rate', 'Email click rate percentage', 'percent', null),
    ('bounce_rate', 'Bounce Rate', 'Email bounce rate percentage', 'percent', null),
    ('unsubscribe_rate', 'Unsubscribe Rate', 'Unsubscribe rate percentage', 'percent', null),
    ('revenue', 'Revenue', 'Total revenue generated', 'currency', null),
    ('conversion_rate', 'Conversion Rate', 'Conversion rate percentage', 'percent', null),
    ('cvr', 'CVR', 'Conversion rate from scraper', 'percent', 'scraper'),
    ('roas', 'ROAS', 'Return on ad spend', 'currency', null),
    ('spend', 'Ad Spend', 'Advertising spend', 'currency', null),
    ('sent_count', 'Sent Count', 'Number of emails sent', 'count', null),
    ('delivered_count', 'Delivered Count', 'Number of emails delivered', 'count', null),
    ('opened_count', 'Opened Count', 'Number of emails opened', 'count', null),
    ('clicked_count', 'Clicked Count', 'Number of emails clicked', 'count', null);

-- Internal and scraper data sources
INSERT INTO api_sources (provider, endpoint, display_name, description, refresh_interval_minutes) VALUES 
    ('internal', 'communication_reports', 'Communications Audit', 'Discord communication tracking', 60),
    ('internal', 'clients', 'Clients', 'Client master data', 1440),
    ('scraper', 'cvr', 'CVR Data', 'Conversion rate data from scraper', 10080),
    ('scraper', 'shopify_themes', 'Shopify Themes', 'Theme data from Shopify', 1440);

-- ============================================================================
-- ROW LEVEL SECURITY (Enable when auth is configured)
-- ============================================================================

-- ALTER TABLE api_sources ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE api_snapshots ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE api_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE api_record_metrics ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE watchtower_rules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE watchtower_alerts ENABLE ROW LEVEL SECURITY;
