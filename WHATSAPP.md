# WhatsApp Notifications

## Setup

1. **Vercel env vars:**

```bash
WHATSAPP_CRON_SECRET=<openssl rand -hex 32>
TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
TWILIO_WHATSAPP_NUMBER=<number>
```

2. **Configure features in UI:**
   `/dashboard/media-buyer/[id]/whatsapp` - toggle features, set schedule

3. **Deploy cron (private server):**

```bash
# Create ~/whatsapp-cron/daily-summary.sh
curl -X POST ${VERCEL_URL}/api/whatsapp/cron-handler \
  -H "x-cron-secret: ${WHATSAPP_CRON_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{"feature":"daily_summary"}'

# Repeat for late-alerts.sh and ad-errors.sh
# chmod +x *.sh
```

4. **Crontab:**

```cron
0 20 * * * ~/whatsapp-cron/daily-summary.sh >> ~/whatsapp-cron/cron.log 2>&1
*/15 * * * * ~/whatsapp-cron/late-alerts.sh >> ~/whatsapp-cron/cron.log 2>&1
*/10 * * * * ~/whatsapp-cron/ad-errors.sh >> ~/whatsapp-cron/cron.log 2>&1
```

## How It Works

**Flow:** Cron server → `/api/whatsapp/cron-handler` → checks `pod_whatsapp_configs` → sends if enabled + time matches

**Table:** `pod_whatsapp_configs`

- `pod_name` + `feature_type` (daily_summary | late_alert | ad_error)
- `is_enabled`, `schedule_time`, `custom_message`
- `last_sent_at` (prevents duplicates)

**Features:**

- **Daily Summary:** ROAS, spend, revenue recap
- **Late Alert:** Unanswered messages >24h
- **Ad Error:** Campaign issues detected

## Files

- `app/api/whatsapp/cron-handler/route.ts` - single endpoint
- `lib/actions/whatsapp-jobs.ts` - job logic
- `lib/utils/whatsapp-config.ts` - config helpers
- `app/dashboard/media-buyer/[id]/whatsapp/` - UI

Done.
