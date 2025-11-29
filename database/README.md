# API Response Storage & Watch Tower

Enterprise-grade system for storing external API data and monitoring it with configurable rules.

---

## Tables Overview (7 total)

| Table                | Purpose                                                       |
| -------------------- | ------------------------------------------------------------- |
| `api_sources`        | Registry of data providers (Omnisend, Shopify, scraper, etc.) |
| `api_snapshots`      | Point-in-time data captures, supports per-client scoping      |
| `api_records`        | Individual records with typed columns                         |
| `api_record_metrics` | M2M table for flexible named metrics                          |
| `metric_definitions` | Optional metadata for known metrics                           |
| `watchtower_rules`   | Surveillance rules with dependencies & notifications          |
| `watchtower_alerts`  | Generated alerts when rules are breached                      |

---

## Table Schemas

### 1. `api_sources`

Registry of data sources/endpoints.

| Column                     | Type         | Default        | Description                                                 |
| -------------------------- | ------------ | -------------- | ----------------------------------------------------------- |
| `id`                       | UUID         | auto-generated | Primary key                                                 |
| `provider`                 | VARCHAR(50)  | NOT NULL       | Provider name: `omnisend`, `shopify`, `scraper`, `internal` |
| `endpoint`                 | VARCHAR(100) | NOT NULL       | Endpoint identifier: `campaigns`, `automations`, `cvr`      |
| `display_name`             | VARCHAR(100) | NOT NULL       | Human-readable name                                         |
| `description`              | TEXT         | NULL           | Optional description                                        |
| `refresh_interval_minutes` | INTEGER      | 60             | How often to refresh data                                   |
| `is_active`                | BOOLEAN      | true           | Whether source is active                                    |
| `created_at`               | TIMESTAMPTZ  | NOW()          | Creation timestamp                                          |
| `updated_at`               | TIMESTAMPTZ  | NOW()          | Last update timestamp (auto-updated)                        |

**Constraints:** `UNIQUE(provider, endpoint)`

### 2. `api_snapshots`

Point-in-time captures for comparison.

| Column          | Type        | Default        | Description                                            |
| --------------- | ----------- | -------------- | ------------------------------------------------------ |
| `id`            | UUID        | auto-generated | Primary key                                            |
| `source_id`     | UUID        | NOT NULL       | FK to `api_sources`                                    |
| `client_id`     | INTEGER     | NULL           | Per-client data scoping                                |
| `snapshot_type` | VARCHAR(20) | `scheduled`    | Type: `scheduled`, `manual`, `triggered`               |
| `total_records` | INTEGER     | 0              | Number of records in snapshot                          |
| `status`        | VARCHAR(20) | `pending`      | Status: `pending`, `processing`, `completed`, `failed` |
| `error_message` | TEXT        | NULL           | Error details if failed                                |
| `started_at`    | TIMESTAMPTZ | NOW()          | When processing started                                |
| `completed_at`  | TIMESTAMPTZ | NULL           | When processing completed                              |
| `created_at`    | TIMESTAMPTZ | NOW()          | Creation timestamp                                     |

**Indexes:** `source_id`, `client_id`, `created_at DESC`, `status`

### 3. `api_records`

Individual records from API responses.

| Column        | Type          | Default        | Description                         |
| ------------- | ------------- | -------------- | ----------------------------------- |
| `id`          | UUID          | auto-generated | Primary key                         |
| `snapshot_id` | UUID          | NOT NULL       | FK to `api_snapshots`               |
| `client_id`   | INTEGER       | NULL           | Per-client data scoping             |
| `external_id` | VARCHAR(255)  | NOT NULL       | ID from the external API            |
| `name`        | VARCHAR(255)  | NULL           | Record name                         |
| `email`       | VARCHAR(255)  | NULL           | Email address (if applicable)       |
| `status`      | VARCHAR(50)   | NULL           | Record status                       |
| `category`    | VARCHAR(100)  | NULL           | Category classification             |
| `tags`        | TEXT[]        | NULL           | Array of tags                       |
| `amount`      | DECIMAL(15,4) | NULL           | Numeric amount (currency, etc.)     |
| `quantity`    | INTEGER       | NULL           | Count/quantity value                |
| `record_date` | TIMESTAMPTZ   | NULL           | Temporal reference for the record   |
| `extra`       | JSONB         | `{}`           | Overflow for unmapped fields (rare) |
| `created_at`  | TIMESTAMPTZ   | NOW()          | Creation timestamp                  |

**Indexes:** `snapshot_id`, `client_id`, `external_id`, `status`, `email`, `category`, `record_date`

### 4. `api_record_metrics`

M2M table for flexible named metrics per record.

| Column         | Type          | Default        | Description                                   |
| -------------- | ------------- | -------------- | --------------------------------------------- |
| `id`           | UUID          | auto-generated | Primary key                                   |
| `record_id`    | UUID          | NOT NULL       | FK to `api_records`                           |
| `metric_name`  | VARCHAR(100)  | NOT NULL       | Metric identifier: `open_rate`, `cvr`, `roas` |
| `metric_value` | DECIMAL(20,6) | NOT NULL       | The metric value                              |
| `metric_unit`  | VARCHAR(20)   | NULL           | Unit: `percent`, `currency`, `count`          |
| `created_at`   | TIMESTAMPTZ   | NOW()          | Creation timestamp                            |

**Constraints:** `UNIQUE(record_id, metric_name)`  
**Indexes:** `record_id`, `metric_name`, `(metric_name, metric_value)`

### 5. `metric_definitions`

Registry of known metrics for UI/validation.

| Column         | Type          | Default  | Description                                 |
| -------------- | ------------- | -------- | ------------------------------------------- |
| `metric_name`  | VARCHAR(100)  | NOT NULL | Primary key                                 |
| `display_name` | VARCHAR(100)  | NOT NULL | Human-readable name                         |
| `description`  | TEXT          | NULL     | Description of the metric                   |
| `metric_unit`  | VARCHAR(20)   | NULL     | Unit: `percent`, `currency`, `count`        |
| `min_value`    | DECIMAL(20,6) | NULL     | Minimum valid value                         |
| `max_value`    | DECIMAL(20,6) | NULL     | Maximum valid value                         |
| `provider`     | VARCHAR(50)   | NULL     | Provider-specific metric (null = universal) |
| `created_at`   | TIMESTAMPTZ   | NOW()    | Creation timestamp                          |

### 6. `watchtower_rules`

Surveillance configuration for monitoring.

| Column                 | Type         | Default        | Description                                                             |
| ---------------------- | ------------ | -------------- | ----------------------------------------------------------------------- |
| `id`                   | UUID         | auto-generated | Primary key                                                             |
| `source_id`            | UUID         | NULL           | FK to `api_sources`                                                     |
| `client_id`            | INTEGER      | NULL           | Rule can be client-specific                                             |
| `target_table`         | VARCHAR(100) | NULL           | Target: `api_records`, `communication_reports`, `clients`               |
| `name`                 | VARCHAR(100) | NOT NULL       | Rule name                                                               |
| `description`          | TEXT         | NULL           | Rule description                                                        |
| `field_name`           | VARCHAR(100) | NOT NULL       | Field to monitor: `status`, `open_rate`, etc.                           |
| `condition`            | VARCHAR(20)  | NOT NULL       | Condition: `equals`, `greater_than`, `less_than`, `changed`, `contains` |
| `threshold_value`      | VARCHAR(255) | NULL           | Comparison threshold                                                    |
| `parent_rule_id`       | UUID         | NULL           | FK to `watchtower_rules` (self-referential)                             |
| `dependency_condition` | VARCHAR(30)  | NULL           | When to fire: `triggered`, `not_triggered`, `acknowledged`              |
| `logic_operator`       | VARCHAR(10)  | `AND`          | Compound logic: `AND`, `OR`                                             |
| `group_id`             | UUID         | NULL           | Groups conditions together                                              |
| `severity`             | VARCHAR(20)  | `warning`      | Alert level: `info`, `warning`, `critical`                              |
| `is_active`            | BOOLEAN      | true           | Whether rule is active                                                  |
| `notify_immediately`   | BOOLEAN      | true           | Send alert when rule triggers                                           |
| `notify_schedule`      | VARCHAR(20)  | NULL           | Digest schedule: `daily`, `weekly`                                      |
| `notify_time`          | TIME         | NULL           | Time to send digest                                                     |
| `notify_day_of_week`   | INTEGER      | NULL           | Day for weekly digest (0=Sunday, 6=Saturday)                            |
| `notify_discord`       | BOOLEAN      | false          | Send to Discord                                                         |
| `notify_email`         | BOOLEAN      | false          | Send via email                                                          |
| `discord_channel_id`   | VARCHAR(100) | NULL           | Discord channel ID                                                      |
| `email_recipients`     | TEXT[]       | NULL           | Email addresses                                                         |
| `last_notified_at`     | TIMESTAMPTZ  | NULL           | Last notification timestamp                                             |
| `created_at`           | TIMESTAMPTZ  | NOW()          | Creation timestamp                                                      |
| `updated_at`           | TIMESTAMPTZ  | NOW()          | Last update timestamp (auto-updated)                                    |

**Indexes:** `source_id`, `client_id`, `target_table`, `parent_rule_id`, `group_id`, `is_active`

### 7. `watchtower_alerts`

Generated alerts when rules are breached.

| Column            | Type         | Default        | Description                         |
| ----------------- | ------------ | -------------- | ----------------------------------- |
| `id`              | UUID         | auto-generated | Primary key                         |
| `rule_id`         | UUID         | NOT NULL       | FK to `watchtower_rules`            |
| `snapshot_id`     | UUID         | NOT NULL       | FK to `api_snapshots`               |
| `record_id`       | UUID         | NULL           | FK to `api_records` (optional)      |
| `client_id`       | INTEGER      | NULL           | Per-client alerts                   |
| `message`         | TEXT         | NOT NULL       | Alert message                       |
| `severity`        | VARCHAR(20)  | NOT NULL       | Alert severity                      |
| `current_value`   | VARCHAR(255) | NULL           | Current value that triggered alert  |
| `previous_value`  | VARCHAR(255) | NULL           | Previous value for comparison       |
| `is_acknowledged` | BOOLEAN      | false          | Whether alert has been acknowledged |
| `acknowledged_at` | TIMESTAMPTZ  | NULL           | When alert was acknowledged         |
| `acknowledged_by` | VARCHAR(255) | NULL           | Who acknowledged the alert          |
| `created_at`      | TIMESTAMPTZ  | NOW()          | Creation timestamp                  |

**Indexes:** `rule_id`, `snapshot_id`, `client_id`, `is_acknowledged (partial: WHERE NOT is_acknowledged)`, `severity`, `created_at DESC`

---

## Data Flow

```
External APIs (Omnisend, Shopify, Scraper)
         │
         ▼
    api_sources ─────► Defines what we fetch
         │
         ▼
   api_snapshots ────► When we fetched (per client)
         │
         ▼
    api_records ─────► What we fetched
         │
         ▼
 api_record_metrics ─► Numeric metrics per record
         │
         ▼
  watchtower_rules ──► What to watch for
         │
         ▼
  watchtower_alerts ─► What was found
```

---

## Key Features

### 1. Per-Client Data Scoping

All snapshots, records, and alerts can be scoped to a specific client:

```sql
-- Get latest CVR snapshot for a client
SELECT * FROM api_snapshots s
JOIN api_sources src ON s.source_id = src.id
WHERE s.client_id = 123
  AND src.provider = 'scraper'
  AND src.endpoint = 'cvr'
ORDER BY s.created_at DESC LIMIT 1;
```

### 2. Flexible Metrics (M2M)

Instead of rigid columns, metrics use self-documenting names:

```sql
-- Query open rates across all campaigns
SELECT r.name, m.metric_value as open_rate
FROM api_records r
JOIN api_record_metrics m ON r.id = m.record_id
WHERE m.metric_name = 'open_rate';
```

### 3. Watch Tower Rules

Rules support:

- **Single conditions**: `ROAS < 2.0`
- **Compound conditions**: Multiple rules with same `group_id` + `logic_operator`
- **Dependencies**: Rule A only fires if Rule B has/hasn't triggered
- **Multi-target**: Watch `api_records`, `communication_reports`, or `clients` table

### 4. Scheduled Notifications

Built into `watchtower_rules` (no separate table):

- Immediate alerts
- Daily/weekly digest
- Discord and/or email channels

---

## Watch Tower Rule Examples

### Simple Rule

```typescript
// Alert if open rate drops below 15%
await createRule({
  source_id: omnisendCampaignsSourceId,
  name: 'Low Open Rate',
  field_name: 'open_rate',
  condition: 'less_than',
  threshold_value: '15',
  severity: 'warning',
  notify_immediately: true,
  notify_discord: true,
  discord_channel_id: '123456789',
})
```

### Compound Rule (ROAS < X AND Spend > Y)

```typescript
const groupId = crypto.randomUUID()

// Condition 1: ROAS < 2
await createRule({
  name: 'Low ROAS + High Spend',
  field_name: 'roas',
  condition: 'less_than',
  threshold_value: '2',
  group_id: groupId,
  logic_operator: 'AND',
})

// Condition 2: Spend > 1000
await createRule({
  name: 'Low ROAS + High Spend (Spend)',
  field_name: 'spend',
  condition: 'greater_than',
  threshold_value: '1000',
  group_id: groupId,
  logic_operator: 'AND',
})
```

### Dependent Rule

```typescript
// Only alert about low CVR if "No Communication" rule has triggered
await createRule({
  name: 'Low CVR (No Contact)',
  field_name: 'cvr',
  condition: 'less_than',
  threshold_value: '2',
  parent_rule_id: noContactRuleId,
  dependency_condition: 'triggered', // Only fire if parent has triggered
  severity: 'critical',
})
```

### Comms Audit Rule

```typescript
// Watch communication_reports table
await createRule({
  target_table: 'communication_reports',
  name: 'No Outreach for 7+ Days',
  field_name: 'days_since_team_message',
  condition: 'greater_than',
  threshold_value: '7',
  severity: 'warning',
})
```

---

## Field Mappings

### CVR Data (from scraper)

| Scraper Field  | Maps To                   |
| -------------- | ------------------------- |
| `client_id`    | `api_snapshots.client_id` |
| `cvr`          | metric: `cvr`             |
| `period_start` | `api_records.record_date` |

### Omnisend Campaigns

| Omnisend Field | Maps To              |
| -------------- | -------------------- |
| `campaignID`   | `external_id`        |
| `name`         | `name`               |
| `status`       | `status`             |
| `sent`         | `quantity`           |
| `openRate`     | metric: `open_rate`  |
| `clickRate`    | metric: `click_rate` |

### Omnisend Automations

| Omnisend Field | Maps To                |
| -------------- | ---------------------- |
| `automationID` | `external_id`          |
| `name`         | `name`                 |
| `status`       | `status`               |
| `sent`         | metric: `sent_count`   |
| `opened`       | metric: `opened_count` |

---

## Seeded Data

### Data Sources

| Provider   | Endpoint                | Display Name         | Description                    | Refresh Interval   |
| ---------- | ----------------------- | -------------------- | ------------------------------ | ------------------ |
| `internal` | `communication_reports` | Communications Audit | Discord communication tracking | 60 min             |
| `internal` | `clients`               | Clients              | Client master data             | 1440 min (daily)   |
| `scraper`  | `cvr`                   | CVR Data             | Conversion rate data           | 10080 min (weekly) |
| `scraper`  | `shopify_themes`        | Shopify Themes       | Theme data from Shopify        | 1440 min (daily)   |

Add more as needed:

```sql
INSERT INTO api_sources (provider, endpoint, display_name, refresh_interval_minutes)
VALUES ('omnisend', 'automations', 'Omnisend Automations', 60);
```

### Metric Definitions

| Metric Name        | Display Name     | Description                  | Unit       | Provider  |
| ------------------ | ---------------- | ---------------------------- | ---------- | --------- |
| `open_rate`        | Open Rate        | Email open rate percentage   | `percent`  | universal |
| `click_rate`       | Click Rate       | Email click rate percentage  | `percent`  | universal |
| `bounce_rate`      | Bounce Rate      | Email bounce rate percentage | `percent`  | universal |
| `unsubscribe_rate` | Unsubscribe Rate | Unsubscribe rate percentage  | `percent`  | universal |
| `revenue`          | Revenue          | Total revenue generated      | `currency` | universal |
| `conversion_rate`  | Conversion Rate  | Conversion rate percentage   | `percent`  | universal |
| `cvr`              | CVR              | Conversion rate from scraper | `percent`  | `scraper` |
| `roas`             | ROAS             | Return on ad spend           | `currency` | universal |
| `spend`            | Ad Spend         | Advertising spend            | `currency` | universal |
| `sent_count`       | Sent Count       | Number of emails sent        | `count`    | universal |
| `delivered_count`  | Delivered Count  | Number of emails delivered   | `count`    | universal |
| `opened_count`     | Opened Count     | Number of emails opened      | `count`    | universal |
| `clicked_count`    | Clicked Count    | Number of emails clicked     | `count`    | universal |

---

## Rule Conditions

| Condition      | Description                                    | Example                      |
| -------------- | ---------------------------------------------- | ---------------------------- |
| `equals`       | Field equals threshold value                   | `status = 'failed'`          |
| `greater_than` | Field is greater than threshold                | `spend > 1000`               |
| `less_than`    | Field is less than threshold                   | `open_rate < 15`             |
| `changed`      | Field value has changed from previous snapshot | `status changed`             |
| `contains`     | Field contains the threshold string            | `tags contains 'high-value'` |

---

## Rule Dependency Conditions

| Condition       | When Rule Fires                                      |
| --------------- | ---------------------------------------------------- |
| `triggered`     | Parent rule has triggered (has unacknowledged alert) |
| `not_triggered` | Parent rule has NOT triggered                        |
| `acknowledged`  | Parent rule's alert has been acknowledged            |

---

## Snapshot Types & Statuses

### Snapshot Types

| Type        | Description                          |
| ----------- | ------------------------------------ |
| `scheduled` | Created by automated refresh job     |
| `manual`    | Created by user action               |
| `triggered` | Created in response to an event/rule |

### Snapshot Statuses

| Status       | Description                            |
| ------------ | -------------------------------------- |
| `pending`    | Snapshot created, not yet processing   |
| `processing` | Currently fetching/processing data     |
| `completed`  | Successfully finished                  |
| `failed`     | Error occurred (check `error_message`) |

---

## Alert Severity Levels

| Severity   | Description                                |
| ---------- | ------------------------------------------ |
| `info`     | Informational, no action required          |
| `warning`  | Potential issue, should be reviewed        |
| `critical` | Urgent issue requiring immediate attention |

---

## Database Triggers

Auto-update `updated_at` timestamp on:

- `api_sources` - When any source record is updated
- `watchtower_rules` - When any rule is modified

```sql
-- Trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## File Structure

```
database/
  migrations/
    001_schema.sql    # Core tables, indexes, triggers, seed data
  README.md           # This file

lib/actions/
  api-responses.ts    # Snapshot & record operations
  watchtower.ts       # Rule & alert operations

types/
  api-responses.ts    # TypeScript interfaces
```

---

## Notification Options

| Field                | Type                    | Description                   |
| -------------------- | ----------------------- | ----------------------------- |
| `notify_immediately` | boolean                 | Send alert when rule triggers |
| `notify_schedule`    | `'daily'` \| `'weekly'` | Digest schedule               |
| `notify_time`        | TIME                    | Time to send digest           |
| `notify_day_of_week` | 0-6                     | Day for weekly (0=Sunday)     |
| `notify_discord`     | boolean                 | Send to Discord               |
| `notify_email`       | boolean                 | Send via email                |
| `discord_channel_id` | string                  | Discord channel ID            |
| `email_recipients`   | string[]                | Email addresses               |

---

## Row Level Security

RLS is prepared but commented out. Enable when auth is configured:

```sql
ALTER TABLE api_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_record_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchtower_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchtower_alerts ENABLE ROW LEVEL SECURITY;
```

---

## PostgreSQL Extensions

Required extension:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

Used for UUID primary key generation via `uuid_generate_v4()`.
