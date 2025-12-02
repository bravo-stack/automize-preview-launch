# WhatsApp Notifications

Send WhatsApp alerts to media buyers using Twilio's WhatsApp Business API.

## Quick Setup

### 1. Get Twilio Credentials

1. Go to [twilio.com/console](https://www.twilio.com/console)
2. Create a new account or log in
3. Navigate to **Messaging > Try it out > Send a WhatsApp message**
4. Copy your credentials:
   - **Account SID**
   - **Auth Token**
   - **Twilio WhatsApp Number** (e.g., +14155238886 for sandbox)
5. For production, request WhatsApp Business approval and get your own number

### 2. Environment Variables

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886
WHATSAPP_API_KEY=random_string_for_api_auth
WHATSAPP_CRON_KEY=random_string_for_cron_auth
```

### 3. Run Database Migration

Execute in Supabase SQL editor:

```
lib/db/migrations/001_whatsapp_notifications.sql
```

Creates: `pod.whatsapp_number`, `whatsapp_schedules`, `ad_account_errors`

### 4. Configure Cron Jobs (Private Server)

Set up these endpoints on your cron scheduler:

```bash
# Scheduled summaries (runs every hour, checks which schedules to fire)
GET /api/whatsapp/scheduled-summary?key=YOUR_CRON_KEY

# Ad error alerts (runs daily at 9 AM UTC)
GET /api/whatsapp/ad-errors?key=YOUR_CRON_KEY

# Late response alerts (runs every 15 minutes during work hours)
GET /api/whatsapp/late-response?key=YOUR_CRON_KEY
```

Example cron schedule:

```
0 * * * * curl "https://your-domain.com/api/whatsapp/scheduled-summary?key=YOUR_CRON_KEY"
0 9 * * * curl "https://your-domain.com/api/whatsapp/ad-errors?key=YOUR_CRON_KEY"
*/15 9-17 * * 1-5 curl "https://your-domain.com/api/whatsapp/late-response?key=YOUR_CRON_KEY"
```

---

## Features

**Scheduled Summaries**

- Send daily/weekly client lists to media buyers
- Customizable time, frequency, and message
- Shows clients needing responses (from `communication_reports` table)

**Ad Error Alerts**

- Notifies media buyer + client when ad account errors occur
- Daily alerts until marked as resolved
- Tracks error duration and urgency

**Late Response Alerts** 🆕

- Monitors client messages and alerts if no team response within 1 hour
- Only fires during work hours (Mon-Fri 9 AM - 5 PM UTC)
- Stateless: queries `communication_reports` directly each run
- Configurable threshold: 1 hour (production) / 30 seconds (test mode)

**Direct Messages**

- Send WhatsApp via API endpoint
- Protected by API key

---

## Usage

### Configure WhatsApp Number (UI)

Go to `/dashboard/media-buyer/[id]/whatsapp`:

1. Add pod's WhatsApp number (+1234567890 format)
2. Create schedules (daily/weekly/custom)
3. Customize message for each schedule

### Send Message (Code)

```typescript
import { sendWhatsAppMessage } from '@/lib/actions/whatsapp'

await sendWhatsAppMessage('+1234567890', 'Hello!')
```

### Log Ad Error (Code)

```typescript
// POST /api/whatsapp/ad-errors
{
  "client_id": 123,
  "error_type": "invalid_token",
  "error_message": "Facebook token expired"
}
```

---

## Production Notes

- **Sandbox**: Twilio provides a sandbox number for testing (+14155238886). Recipients must join via WhatsApp first.
- **Production**: Request WhatsApp Business approval from Twilio to get your own number and remove sandbox restrictions
- **Phone numbers**: Must be E.164 format (+1234567890)
- **Schedules**: All times stored in UTC
- **Pricing**: Pay-as-you-go per message sent (check Twilio pricing for your region)
- **Cron**: Use your private server scheduler (not Vercel cron)

---

## API Reference

| Endpoint                          | Method | Auth     | Purpose                   |
| --------------------------------- | ------ | -------- | ------------------------- |
| `/api/whatsapp/send`              | POST   | API Key  | Send direct message       |
| `/api/whatsapp/scheduled-summary` | GET    | Cron Key | Send scheduled summaries  |
| `/api/whatsapp/ad-errors`         | GET    | Cron Key | Send ad error alerts      |
| `/api/whatsapp/ad-errors`         | POST   | API Key  | Log new error             |
| `/api/whatsapp/ad-errors`         | PATCH  | API Key  | Mark error resolved       |
| `/api/whatsapp/late-response`     | GET    | Cron Key | Send late response alerts |
