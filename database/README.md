# API Response Storage

Enterprise-grade system for storing and querying data from external services (Omnisend, Klaviyo, Shopify, etc.).

---

## Overview

1. **Stores API data** - Saves responses in queryable typed columns
2. **Flexible metrics** - M2M table with self-documenting metric names
3. **Time comparisons** - Compare data across different periods
4. **Watch Tower** - Alerts when metrics cross thresholds

---

## Database Tables (7 total)

| Table                | Purpose                                                  |
| -------------------- | -------------------------------------------------------- |
| `api_sources`        | Registry of APIs we fetch from                           |
| `api_snapshots`      | Tracks each fetch operation (date, status, record count) |
| `api_records`        | The actual data, stored in queryable columns             |
| `api_record_metrics` | **M2M table** for named metrics per record               |
| `metric_definitions` | Registry of known metrics for validation/display         |
| `watchtower_rules`   | Alert rules (e.g., "alert if revenue drops 30%")         |
| `watchtower_alerts`  | Triggered alerts                                         |

---

## How Records Are Stored

### Core Fields (`api_records`)

| Column        | Type      | Use for                                             |
| ------------- | --------- | --------------------------------------------------- |
| `external_id` | VARCHAR   | ID from the external service (order ID, contact ID) |
| `name`        | VARCHAR   | Names, titles, labels                               |
| `email`       | VARCHAR   | Email addresses                                     |
| `status`      | VARCHAR   | Status values (completed, pending, subscribed)      |
| `amount`      | DECIMAL   | Money values (order total, revenue, spend)          |
| `quantity`    | INTEGER   | Counts (items, subscribers, clicks)                 |
| `record_date` | TIMESTAMP | When the record occurred                            |
| `category`    | VARCHAR   | Categories, types                                   |
| `tags`        | TEXT[]    | Array of tags                                       |
| `extra`       | JSONB     | Overflow for unmapped fields (rare edge cases only) |

### Named Metrics (`api_record_metrics`) - M2M Table

Instead of generic `metric_1`, `metric_2` columns, metrics are stored in a Many-to-Many table with **self-documenting names**:

| Column         | Type    | Description                                             |
| -------------- | ------- | ------------------------------------------------------- |
| `record_id`    | UUID    | Links to `api_records`                                  |
| `metric_name`  | VARCHAR | Self-documenting: `open_rate`, `revenue`, `bounce_rate` |
| `metric_value` | DECIMAL | The numeric value                                       |
| `metric_unit`  | VARCHAR | Optional: `percent`, `currency`, `count`                |

**Benefits:**

- ✅ Self-documenting column names
- ✅ Unlimited metrics per record
- ✅ Easy to add new metrics without schema changes
- ✅ Queryable and indexable

---

## SQL Query Examples

```sql
-- Total revenue by date
SELECT DATE(s.created_at), SUM(r.amount) as revenue
FROM api_records r
JOIN api_snapshots s ON r.snapshot_id = s.id
GROUP BY DATE(s.created_at);

-- Find high-value orders
SELECT * FROM api_records WHERE amount > 500;

-- Query specific metrics by name
SELECT r.external_id, r.name, m.metric_name, m.metric_value
FROM api_records r
JOIN api_record_metrics m ON r.id = m.record_id
WHERE m.metric_name = 'open_rate' AND m.metric_value > 20;

-- Aggregate metrics across a snapshot
SELECT m.metric_name,
       COUNT(*) as count,
       AVG(m.metric_value) as avg_value,
       MAX(m.metric_value) as max_value
FROM api_records r
JOIN api_record_metrics m ON r.id = m.record_id
WHERE r.snapshot_id = 'snapshot-uuid'
GROUP BY m.metric_name;
```

---

## Field Mapping by Service

When saving data, map each service's fields to the standard columns:

### Omnisend Orders

| Omnisend Field      | Maps To       |
| ------------------- | ------------- |
| `orderID`           | `external_id` |
| `orderSum`          | `amount`      |
| `fulfillmentStatus` | `status`      |
| `createdAt`         | `record_date` |
| `email`             | `email`       |
| Product count       | `quantity`    |

### Omnisend Campaigns (with metrics)

| Omnisend Field | Maps To                              |
| -------------- | ------------------------------------ |
| `campaignID`   | `external_id`                        |
| `name`         | `name`                               |
| `status`       | `status`                             |
| `sent`         | `quantity`                           |
| `startDate`    | `record_date`                        |
| `opened`       | metric: `opened_count`               |
| `clicked`      | metric: `clicked_count`              |
| `bounced`      | metric: `bounced_count`              |
| `openRate`     | metric: `open_rate` (unit: percent)  |
| `clickRate`    | metric: `click_rate` (unit: percent) |

### Omnisend Contacts

| Omnisend Field       | Maps To       |
| -------------------- | ------------- |
| `contactID`          | `external_id` |
| `email`              | `email`       |
| `firstName lastName` | `name`        |
| `status`             | `status`      |
| `createdAt`          | `record_date` |
| `tags`               | `tags`        |

---

## Usage

### 1. Register a Source (one-time)

```sql
INSERT INTO api_sources (provider, endpoint, display_name)
VALUES ('klaviyo', 'profiles', 'Klaviyo Profiles');
```

### 2. Create a Snapshot and Save Records with Metrics

```typescript
import {
  createSnapshot,
  saveRecordsWithMetrics,
} from '@/lib/actions/api-responses'

// Create snapshot
const snapshot = await createSnapshot(sourceId, 'manual')

// Save records with their metrics
await saveRecordsWithMetrics(snapshot.id, [
  {
    external_id: 'campaign-123',
    name: 'Summer Sale Email',
    status: 'sent',
    quantity: 5000,
    record_date: '2025-11-28T10:30:00Z',
    metrics: [
      { metric_name: 'open_rate', metric_value: 24.5, metric_unit: 'percent' },
      { metric_name: 'click_rate', metric_value: 3.2, metric_unit: 'percent' },
      { metric_name: 'opened_count', metric_value: 1225, metric_unit: 'count' },
      { metric_name: 'clicked_count', metric_value: 160, metric_unit: 'count' },
      {
        metric_name: 'revenue',
        metric_value: 15420.5,
        metric_unit: 'currency',
      },
    ],
  },
  {
    external_id: 'campaign-124',
    name: 'Flash Sale',
    status: 'sent',
    quantity: 8000,
    record_date: '2025-11-28T14:00:00Z',
    metrics: [
      { metric_name: 'open_rate', metric_value: 28.1, metric_unit: 'percent' },
      { metric_name: 'click_rate', metric_value: 4.5, metric_unit: 'percent' },
      {
        metric_name: 'revenue',
        metric_value: 22350.0,
        metric_unit: 'currency',
      },
    ],
  },
])
```

### 3. Query Records with Metrics

```typescript
import {
  getRecordsWithMetrics,
  getMetricAggregations,
} from '@/lib/actions/api-responses'

// Get records with all their metrics
const records = await getRecordsWithMetrics(snapshotId)
// Returns records with metrics array attached

// Get aggregations for a snapshot
const aggregations = await getMetricAggregations(snapshotId)
// [
//   { metric_name: 'open_rate', count: 2, sum: 52.6, avg: 26.3, min: 24.5, max: 28.1 },
//   { metric_name: 'revenue', count: 2, sum: 37770.50, avg: 18885.25, ... }
// ]
```

### 4. Compare Periods

```typescript
import { compareSnapshots } from '@/lib/actions/api-responses'

const comparison = await compareSnapshots(
  lastWeekSnapshotId,
  thisWeekSnapshotId,
)
// Returns:
// {
//   record_comparisons: [
//     { field: 'amount', base_value: 4000, compare_value: 5000, change_percent: 25 },
//   ],
//   metric_comparisons: [
//     { metric_name: 'open_rate', base_value: 22.0, compare_value: 26.3, change_percent: 19.5 },
//     { metric_name: 'revenue', base_value: 30000, compare_value: 37770.50, change_percent: 25.9 },
//   ]
// }
```

---

## Watch Tower

Set up rules to monitor your data and get alerts.

### Creating Rules

```typescript
import { createRule } from '@/lib/actions/watchtower'

// Alert if open_rate drops below 15%
await createRule({
  source_id: sourceId,
  name: 'Low Open Rate Alert',
  field_name: 'open_rate', // Can reference metric names!
  condition: 'less_than',
  threshold_value: '15',
  severity: 'warning',
})

// Alert if revenue changes
await createRule({
  source_id: sourceId,
  name: 'Revenue Change',
  field_name: 'revenue',
  condition: 'changed',
  severity: 'info',
})
```

### Conditions

| Condition      | Meaning                     |
| -------------- | --------------------------- |
| `equals`       | Exactly matches value       |
| `greater_than` | Above threshold             |
| `less_than`    | Below threshold             |
| `changed`      | Value changed from previous |
| `contains`     | String contains value       |

### Managing Alerts

```typescript
import { getAlerts, acknowledgeAlert } from '@/lib/actions/watchtower'

// Get unacknowledged alerts
const alerts = await getAlerts({ is_acknowledged: false })

// Acknowledge an alert
await acknowledgeAlert(alertId, 'admin@example.com')
```

---

## File Structure

```
database/
  migrations/
    001_api_response_storage.sql    # Creates all tables
  seeds/
    001_seed_omnisend_provider.sql  # Adds Omnisend sources
  README.md

lib/actions/
  api-responses.ts    # Snapshot, record, and metric functions
  watchtower.ts       # Rule and alert functions

types/
  api-responses.ts    # TypeScript types
  omnisend.ts         # Omnisend-specific types
```

---

## Adding a New Service

1. Add source to `api_sources`:

```sql
INSERT INTO api_sources (provider, endpoint, display_name, description)
VALUES ('newservice', 'campaigns', 'NewService Campaigns', 'Campaign data from NewService');
```

2. Create a mapping function:

```typescript
function mapServiceCampaigns(
  campaigns: ServiceCampaign[],
): RecordWithMetricsInput[] {
  return campaigns.map((campaign) => ({
    external_id: campaign.id,
    name: campaign.title,
    status: campaign.status,
    record_date: campaign.sent_at,
    quantity: campaign.recipients,
    metrics: [
      {
        metric_name: 'open_rate',
        metric_value: campaign.openRate,
        metric_unit: 'percent',
      },
      {
        metric_name: 'click_rate',
        metric_value: campaign.clickRate,
        metric_unit: 'percent',
      },
      {
        metric_name: 'revenue',
        metric_value: campaign.revenue,
        metric_unit: 'currency',
      },
    ],
  }))
}
```

3. Use `saveRecordsWithMetrics()`.

---

## Pre-seeded Metric Definitions

The `metric_definitions` table comes pre-populated with common metrics:

| metric_name        | display_name     | unit     |
| ------------------ | ---------------- | -------- |
| `open_rate`        | Open Rate        | percent  |
| `click_rate`       | Click Rate       | percent  |
| `bounce_rate`      | Bounce Rate      | percent  |
| `unsubscribe_rate` | Unsubscribe Rate | percent  |
| `conversion_rate`  | Conversion Rate  | percent  |
| `revenue`          | Revenue          | currency |
| `sent_count`       | Sent Count       | count    |
| `delivered_count`  | Delivered Count  | count    |
| `opened_count`     | Opened Count     | count    |
| `clicked_count`    | Clicked Count    | count    |

You can add more as needed - the M2M table accepts any metric name.

---

## Design Decisions

| Decision                 | Rationale                                                               |
| ------------------------ | ----------------------------------------------------------------------- |
| M2M metrics table        | Self-documenting names, unlimited flexibility, no schema changes needed |
| Typed core columns       | Common fields (amount, status, email) are queryable without joins       |
| Minimal JSONB use        | `extra` column only for rare edge cases                                 |
| Metric definitions table | Provides validation/display metadata, but not required                  |
| Cascading deletes        | Deleting a snapshot removes all associated records and metrics          |
