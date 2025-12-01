# Migration Guide: Meta WhatsApp Cloud API → Twilio

This document outlines the changes made to migrate from Meta's WhatsApp Cloud API to Twilio's WhatsApp Business API.

## What Changed

### 1. Dependencies

- **Added**: `twilio` npm package
- **Removed**: Direct fetch calls to Meta's Graph API

### 2. Environment Variables

#### Before (Meta):

```env
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
```

#### After (Twilio):

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886
```

**Action Required**: Update your `.env` file with Twilio credentials. See `.env.example.whatsapp` for reference.

### 3. Code Changes

#### Phone Number Formatting

- **Before**: Phone numbers sent to Meta in E.164 format without prefix
- **After**: Phone numbers sent to Twilio with `whatsapp:` prefix (e.g., `whatsapp:+1234567890`)

The `sendWhatsAppMessage` function handles this formatting automatically, so no changes needed in calling code.

#### Message ID Format

- **Before**: Meta message IDs (format varies)
- **After**: Twilio SIDs (starts with `SM...`)

### 4. Files Modified

1. **lib/actions/whatsapp.ts**
   - Replaced Meta Cloud API implementation with Twilio SDK
   - Updated environment variable names
   - Changed phone number formatting to include `whatsapp:` prefix
   - Error handling updated for Twilio error format

2. **docs/whatsapp-notifications.md**
   - Updated setup instructions for Twilio
   - Changed credential requirements
   - Updated production notes for Twilio pricing and sandbox

3. **package.json**
   - Added `twilio` dependency

## Testing Checklist

### Setup Twilio Sandbox (Development)

1. Log in to [Twilio Console](https://www.twilio.com/console)
2. Navigate to **Messaging > Try it out > Send a WhatsApp message**
3. Note your sandbox number (usually `+14155238886`)
4. Send "join <sandbox-keyword>" from your test WhatsApp number
5. Update `.env` with Twilio credentials

### Test Endpoints

- [ ] **Direct Send**: `POST /api/whatsapp/send`

  ```bash
  curl -X POST https://your-domain.com/api/whatsapp/send \
    -H "x-api-key: YOUR_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"to": "+1234567890", "message": "Test message"}'
  ```

- [ ] **Scheduled Summary**: `GET /api/whatsapp/scheduled-summary?key=YOUR_CRON_KEY`
  - Verify schedules are processed correctly
  - Check WhatsApp messages are delivered

- [ ] **Ad Errors**: `GET /api/whatsapp/ad-errors?key=YOUR_CRON_KEY`
  - Verify error alerts are sent to media buyers
  - Verify client notifications work

### UI Testing

- [ ] Navigate to `/dashboard/media-buyer/[id]/whatsapp`
- [ ] Test adding/updating pod WhatsApp number
- [ ] Create new schedules
- [ ] Verify schedules are saved correctly

## Production Deployment

### Before Going Live

1. **Request WhatsApp Business Approval**
   - Submit your use case to Twilio
   - Wait for approval (can take several days)
   - Get your own WhatsApp Business number

2. **Update Environment Variables**

   ```env
   TWILIO_WHATSAPP_NUMBER=+1234567890  # Your approved number
   ```

3. **Update Cron Jobs**
   - No changes needed to cron endpoints
   - Ensure cron scheduler has correct URL and keys

4. **Monitor First Messages**
   - Check Twilio console for message status
   - Verify delivery receipts
   - Monitor error logs

### Rollback Plan

If issues arise, you can rollback by:

1. Revert code changes (git checkout previous commit)
2. Restore old environment variables
3. Run `npm install` to restore old dependencies
4. Redeploy

## Key Differences: Meta vs Twilio

| Feature            | Meta Cloud API                 | Twilio                                 |
| ------------------ | ------------------------------ | -------------------------------------- |
| **Sandbox**        | Limited to 5 test numbers      | Unlimited, but requires "join" keyword |
| **Pricing**        | 1,000 free conversations/mo    | Pay-per-message                        |
| **Setup**          | Facebook Business verification | Simpler, faster approval               |
| **Number Format**  | E.164                          | E.164 with `whatsapp:` prefix          |
| **SDK**            | Manual fetch calls             | Official Twilio SDK                    |
| **Error Handling** | Graph API errors               | Twilio REST exceptions                 |

## Support

- [Twilio WhatsApp Docs](https://www.twilio.com/docs/whatsapp)
- [Twilio Node SDK](https://www.twilio.com/docs/libraries/node)
- [Twilio Console](https://www.twilio.com/console)

## Notes

- All existing API routes remain unchanged
- Database schema is unchanged
- UI components are unchanged
- Only the underlying message sending mechanism changed
- All functionality (scheduled summaries, ad errors, direct send) works identically
