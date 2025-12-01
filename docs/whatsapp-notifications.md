# WhatsApp Notifications

Send WhatsApp alerts to media buyers using Meta's WhatsApp Cloud API.

## Quick Setup

### 1. Get Meta Credentials

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Create App → Business → Add WhatsApp product
3. Copy from **WhatsApp > Getting Started**:
   - **Phone Number ID**
   - **Access Token** (use temporary for testing)
4. Add test recipients (up to 5 numbers for testing)

### 2. Environment Variables

```env
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
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
```

Example cron schedule:

```
0 * * * * curl "https://your-domain.com/api/whatsapp/scheduled-summary?key=YOUR_CRON_KEY"
0 9 * * * curl "https://your-domain.com/api/whatsapp/ad-errors?key=YOUR_CRON_KEY"
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

- **Free tier**: 1,000 conversations/month
- **Phone numbers**: Must be E.164 format (+1234567890)
- **Schedules**: All times stored in UTC
- **Production**: Verify business, get permanent access token, add payment method
- **Cron**: Use your private server scheduler (not Vercel cron)

---

## API Reference

| Endpoint                          | Method | Auth     | Purpose                  |
| --------------------------------- | ------ | -------- | ------------------------ |
| `/api/whatsapp/send`              | POST   | API Key  | Send direct message      |
| `/api/whatsapp/scheduled-summary` | GET    | Cron Key | Send scheduled summaries |
| `/api/whatsapp/ad-errors`         | GET    | Cron Key | Send ad error alerts     |
| `/api/whatsapp/ad-errors`         | POST   | API Key  | Log new error            |
| `/api/whatsapp/ad-errors`         | PATCH  | API Key  | Mark error resolved      |
