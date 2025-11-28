-- ============================================================================
-- API Response Storage Schema - Enterprise Grade
-- ============================================================================
-- Stores snapshots and records from external APIs (Omnisend, Klaviyo, etc.)
-- Supports time-based comparisons and Watch Tower surveillance
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. API_SOURCES - Registry of data sources/endpoints
-- ============================================================================
CREATE TABLE api_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Source identification
    provider VARCHAR(50) NOT NULL,      -- 'omnisend', 'klaviyo', 'shopify'
    endpoint VARCHAR(100) NOT NULL,     -- 'contacts', 'products', 'campaigns'
    
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
    
    -- Snapshot metadata
    snapshot_type VARCHAR(20) DEFAULT 'scheduled',  -- 'scheduled', 'manual', 'triggered'
    total_records INTEGER DEFAULT 0,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_snapshots_source ON api_snapshots(source_id);
CREATE INDEX idx_snapshots_created ON api_snapshots(created_at DESC);
CREATE INDEX idx_snapshots_status ON api_snapshots(status);

-- ============================================================================
-- 3. API_RECORDS - Individual records from API responses
-- ============================================================================
CREATE TABLE api_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_id UUID NOT NULL REFERENCES api_snapshots(id) ON DELETE CASCADE,
    
    -- Universal identifiers
    external_id VARCHAR(255) NOT NULL,  -- ID from the external API
    
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
CREATE INDEX idx_records_external ON api_records(external_id);
CREATE INDEX idx_records_status ON api_records(status);
CREATE INDEX idx_records_email ON api_records(email);
CREATE INDEX idx_records_category ON api_records(category);
CREATE INDEX idx_records_date ON api_records(record_date);

-- ============================================================================
-- 4. API_RECORD_METRICS - M2M table for flexible named metrics
-- ============================================================================
-- Enterprise-grade approach: Self-documenting metric names instead of metric_1-4
-- Allows unlimited metrics per record with clear naming
CREATE TABLE api_record_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID NOT NULL REFERENCES api_records(id) ON DELETE CASCADE,
    
    -- Metric identification
    metric_name VARCHAR(100) NOT NULL,  -- 'open_rate', 'click_rate', 'revenue', 'bounce_rate'
    metric_value DECIMAL(20,6) NOT NULL,
    
    -- Optional metadata
    metric_unit VARCHAR(20),            -- 'percent', 'currency', 'count', null
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate metrics per record
    UNIQUE(record_id, metric_name)
);

CREATE INDEX idx_metrics_record ON api_record_metrics(record_id);
CREATE INDEX idx_metrics_name ON api_record_metrics(metric_name);
CREATE INDEX idx_metrics_name_value ON api_record_metrics(metric_name, metric_value);

-- ============================================================================
-- 5. METRIC_DEFINITIONS - Optional registry of known metrics
-- ============================================================================
-- Provides metadata about metrics for UI display and validation
CREATE TABLE metric_definitions (
    -- Metric identification (primary key)
    metric_name VARCHAR(100) PRIMARY KEY,
    
    -- Display info
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Typing and validation
    metric_unit VARCHAR(20),            -- 'percent', 'currency', 'count'
    min_value DECIMAL(20,6),
    max_value DECIMAL(20,6),
    
    -- Provider context
    provider VARCHAR(50),               -- Which provider uses this, null = universal
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed common metrics
INSERT INTO metric_definitions (metric_name, display_name, description, metric_unit, provider) VALUES
    ('open_rate', 'Open Rate', 'Email open rate percentage', 'percent', null),
    ('click_rate', 'Click Rate', 'Email click rate percentage', 'percent', null),
    ('bounce_rate', 'Bounce Rate', 'Email bounce rate percentage', 'percent', null),
    ('unsubscribe_rate', 'Unsubscribe Rate', 'Unsubscribe rate percentage', 'percent', null),
    ('revenue', 'Revenue', 'Total revenue generated', 'currency', null),
    ('conversion_rate', 'Conversion Rate', 'Conversion rate percentage', 'percent', null),
    ('sent_count', 'Sent Count', 'Number of emails sent', 'count', null),
    ('delivered_count', 'Delivered Count', 'Number of emails delivered', 'count', null),
    ('opened_count', 'Opened Count', 'Number of emails opened', 'count', null),
    ('clicked_count', 'Clicked Count', 'Number of emails clicked', 'count', null);

-- ============================================================================
-- 6. WATCHTOWER_RULES - Surveillance configuration
-- ============================================================================
CREATE TABLE watchtower_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES api_sources(id) ON DELETE CASCADE,
    
    -- Rule definition
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- What to watch
    field_name VARCHAR(100) NOT NULL,   -- 'status', 'amount', 'open_rate', etc.
    condition VARCHAR(20) NOT NULL,      -- 'equals', 'greater_than', 'less_than', 'changed', 'contains'
    threshold_value VARCHAR(255),        -- Value to compare against
    
    -- Alerting
    severity VARCHAR(20) DEFAULT 'warning',  -- 'info', 'warning', 'critical'
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rules_source ON watchtower_rules(source_id);
CREATE INDEX idx_rules_active ON watchtower_rules(is_active);

-- ============================================================================
-- 7. WATCHTOWER_ALERTS - Generated alerts
-- ============================================================================
CREATE TABLE watchtower_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID NOT NULL REFERENCES watchtower_rules(id) ON DELETE CASCADE,
    snapshot_id UUID NOT NULL REFERENCES api_snapshots(id) ON DELETE CASCADE,
    record_id UUID REFERENCES api_records(id) ON DELETE SET NULL,
    
    -- Alert details
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    
    -- Current and previous values for context
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
CREATE INDEX idx_alerts_unacknowledged ON watchtower_alerts(is_acknowledged) WHERE NOT is_acknowledged;
CREATE INDEX idx_alerts_severity ON watchtower_alerts(severity);
CREATE INDEX idx_alerts_created ON watchtower_alerts(created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
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
-- ROW LEVEL SECURITY (Enable when auth is configured)
-- ============================================================================

-- ALTER TABLE api_sources ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE api_snapshots ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE api_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE api_record_metrics ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE watchtower_rules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE watchtower_alerts ENABLE ROW LEVEL SECURITY;
