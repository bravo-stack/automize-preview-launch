# WhatsApp Notifications

This module enables WhatsApp notifications for media buyers using Twilio's WhatsApp Business API.

## Features

1. **Direct Messages** - Send WhatsApp messages via API
2. **Scheduled Summaries** - Daily/weekly summaries of clients needing responses
3. **Ad Error Alerts** - Daily alerts for ad account errors until resolved

## Setup

### 1. Environment Variables

Add these to your `.env.local`:

```env
# Twilio WhatsApp Credentials
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # Your Twilio WhatsApp number

# API Keys for external triggers
WHATSAPP_API_KEY=your_secure_random_key
WHATSAPP_CRON_KEY=your_cron_secret_key
```

### 2. Database Migration

Run the SQL migration in Supabase:

```
lib/db/migrations/001_whatsapp_notifications.sql
```

This creates:

- `whatsapp_number` column on `pod` table
- `whatsapp_schedules` table (uses `pod_name` text FK to `pod.name`)
- `ad_account_errors` table (uses `client_id` bigint FK to `clients.id`)

### 3. Vercel Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/whatsapp/scheduled-summary?key=YOUR_CRON_KEY",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/whatsapp/ad-errors?key=YOUR_CRON_KEY",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## API Routes

### POST `/api/whatsapp/send`

Send a direct WhatsApp message.

```typescript
// Headers
{ "x-api-key": "your_api_key" }

// Body
{
  "to": "+1234567890",
  "message": "Hello from Automize!"
}
```

### GET `/api/whatsapp/scheduled-summary`

Cron endpoint - sends scheduled summaries to media buyers.

### GET `/api/whatsapp/ad-errors`

Cron endpoint - sends daily ad error alerts.

### POST `/api/whatsapp/ad-errors`

Log a new ad account error.

### PATCH `/api/whatsapp/ad-errors`

Mark an error as resolved.

## File Structure

```
lib/
├── actions/
│   ├── whatsapp.ts           # Core send functions
│   └── whatsapp-schedules.ts # Schedule CRUD operations
├── db/
│   └── migrations/
│       └── 001_whatsapp_notifications.sql

app/
├── api/
│   └── whatsapp/
│       ├── send/route.ts
│       ├── scheduled-summary/route.ts
│       └── ad-errors/route.ts
└── dashboard/
    └── media-buyer/
        └── [id]/
            └── whatsapp/
                ├── page.tsx
                └── whatsapp-settings-client.tsx

types/
└── whatsapp.ts               # TypeScript definitions
```

## Usage Examples

### Send a message programmatically

```typescript
import { sendWhatsAppMessage } from '@/lib/actions/whatsapp'

const result = await sendWhatsAppMessage('+1234567890', 'Hello!')
if (result.success) {
  console.log('Sent:', result.messageId)
}
```

### Create a schedule

```typescript
import { createSchedule } from '@/lib/actions/whatsapp-schedules'

await createSchedule({
  pod_id: 1,
  frequency: 'daily',
  time: '09:00',
  timezone: 'America/New_York',
  custom_message: 'Good morning! These clients need attention:',
})
```

## Notes

- WhatsApp numbers must include country code (e.g., `+1234567890`)
- Twilio requires WhatsApp Business API approval for production
- Test with Twilio Sandbox first: https://www.twilio.com/docs/whatsapp/sandbox
