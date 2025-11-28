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

## Seeded Data Sources

| Provider   | Endpoint                | Description            |
| ---------- | ----------------------- | ---------------------- |
| `internal` | `communication_reports` | Discord comms tracking |
| `internal` | `clients`               | Client master data     |
| `scraper`  | `cvr`                   | Weekly CVR data        |
| `scraper`  | `shopify_themes`        | Shopify theme data     |

Add more as needed:

```sql
INSERT INTO api_sources (provider, endpoint, display_name, refresh_interval_minutes)
VALUES ('omnisend', 'automations', 'Omnisend Automations', 60);
```

---

## File Structure

```
database/
  migrations/
    001_api_response_storage.sql  # Core tables
    002_enhancements.sql          # Client scoping, rule enhancements
  README.md                       # This file

lib/actions/
  api-responses.ts    # Snapshot & record operations
  watchtower.ts       # Rule & alert operations

types/
  api-responses.ts    # TypeScript interfaces
```

---

## Rule Dependency Conditions

| Condition       | When Rule Fires                                      |
| --------------- | ---------------------------------------------------- |
| `triggered`     | Parent rule has triggered (has unacknowledged alert) |
| `not_triggered` | Parent rule has NOT triggered                        |
| `acknowledged`  | Parent rule's alert has been acknowledged            |

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
