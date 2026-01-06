# Twilio WhatsApp Integration - Best Practices & Implementation Guide

> **Last Updated:** January 6, 2026  
> **Purpose:** Document all fixes, learnings, and best practices for Twilio WhatsApp Business API integration.

---

## Table of Contents

1. [Content Variables (Template Messages)](#1-content-variables-template-messages)
2. [Business Profile Configuration](#2-business-profile-configuration)
3. [Phone Number Validation](#3-phone-number-validation)
4. [Message Logging & Delivery Tracking](#4-message-logging--delivery-tracking)
5. [Status Callback Webhooks](#5-status-callback-webhooks)
6. [Rate Limiting](#6-rate-limiting)
7. [Error Handling](#7-error-handling)
8. [Green Checkmark Verification](#8-green-checkmark-verification)
9. [Quick Reference Checklist](#9-quick-reference-checklist)

---

## 1. Content Variables (Template Messages)

### Problem

When using Twilio's Content API with WhatsApp templates, the `contentVariables` parameter has strict restrictions. Sending invalid content results in:

```
Error: "The Content Variables parameter is invalid."
```

### Root Cause

Twilio/WhatsApp content variables do **NOT** support:

| ❌ Not Allowed     | Example                     |
| ------------------ | --------------------------- |
| Newline characters | `\n`                        |
| Asterisks (bold)   | `*text*`                    |
| Bullet points      | `•`                         |
| Emojis             | `🚨`, `⚠️`, `🆘`            |
| Multi-line strings | Any string with line breaks |

### Solution

**Always use single-line, plain text strings for content variables.**

```typescript
// ❌ WRONG - Will fail
const message = `🚨 *Alert Name* [URGENT]

*Message:* Something happened

*Details:*
• Value: 123
• Field: test`

contentVariables: JSON.stringify({ '1': message })

// ✅ CORRECT - Single line, no special characters
const message = `[URGENT] Alert Name - Something happened (Current: 123, Field: test)`

contentVariables: JSON.stringify({ '1': message })
```

### Implementation Example

```typescript
// Format function for WhatsApp template variables
function formatWhatsAppAlert(alert: Alert, rule: Rule): string {
  const severityLabel: Record<Severity, string> = {
    critical: 'CRITICAL',
    warning: 'WARNING',
    info: 'INFO',
    urgent: 'URGENT',
  }

  const severity = severityLabel[alert.severity] || 'ALERT'
  const currentValue = alert.current_value || 'N/A'
  const fieldName = rule.field_name

  // Single-line format - NO newlines, NO special characters
  return `[${severity}] ${rule.name} - ${alert.message} (Current: ${currentValue}, Field: ${fieldName})`
}
```

### Key Takeaway

> **The template body can have formatting (emojis, bold, newlines) - but the VARIABLES you pass in must be plain single-line text.**

---

## 2. Business Profile Configuration

### Problem

Messages appear as "unsaved contact" instead of showing the business name and profile.

### Root Cause

The WhatsApp Business Profile in Twilio Console is incomplete or not configured.

### Solution

Configure the full business profile in **Twilio Console → Messaging → WhatsApp Senders → [Your Number]**:

| Field                 | Required?             | Notes                                             |
| --------------------- | --------------------- | ------------------------------------------------- |
| Business Display Name | ✅ Yes                | Requires Meta approval to change                  |
| Profile Photo         | ⚠️ Highly Recommended | 640x640px minimum, square, JPG/PNG                |
| Profile About         | ⚠️ Recommended        | Replace default "Hey there! I am using WhatsApp." |
| Business Website      | Optional              | Your company URL                                  |
| Business Description  | Optional              | Up to 512 characters                              |
| Business Email        | Optional              | Contact email                                     |
| Business Address      | Optional              | Physical address                                  |
| Vertical/Category     | Optional              | Business category                                 |

### Review Requirements

| Field            | Requires Review?                       |
| ---------------- | -------------------------------------- |
| Profile Photo    | ❌ No - Instant update                 |
| About Text       | ❌ No - Instant update                 |
| Website          | ❌ No - Instant update                 |
| Description      | ❌ No - Instant update                 |
| Email/Address    | ❌ No - Instant update                 |
| **Display Name** | ✅ Yes - Requires Meta/WhatsApp review |

### Example Profile About Text

```
Official alerts from [Company Name]. Real-time monitoring and analytics notifications.
```

---

## 3. Phone Number Validation

### Problem

Invalid phone numbers cause message delivery failures and wasted API calls.

### Solution

Always validate and clean phone numbers before sending:

```typescript
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

export function validateAndCleanPhoneNumber(
  phone: string | null | undefined,
): string | null {
  if (!phone) return null

  // Remove common prefixes and clean
  let cleaned = phone.replace('whatsapp:', '').replace(/\s+/g, '').trim()

  // Ensure + prefix
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned
  }

  // Validate using libphonenumber
  try {
    if (!isValidPhoneNumber(cleaned)) {
      return null
    }
    const parsed = parsePhoneNumber(cleaned)
    return parsed?.format('E.164') || null
  } catch {
    return null
  }
}
```

### E.164 Format

All phone numbers must be in E.164 format:

```
+[country code][number]

Examples:
+14155238886 (US)
+2349048188177 (Nigeria)
+447911123456 (UK)
```

---

## 4. Message Logging & Delivery Tracking

### Best Practice

Always log messages to a database for:

- Audit trail
- Delivery status tracking
- Debugging failed messages
- Analytics

### Database Schema

```sql
CREATE TABLE whatsapp_message_logs (
  id SERIAL PRIMARY KEY,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  pod_name VARCHAR(255),
  recipient_name VARCHAR(255),
  recipient_phone_number VARCHAR(50) NOT NULL,
  source_feature VARCHAR(100) NOT NULL,
  message_content TEXT,
  delivery_status VARCHAR(50) DEFAULT 'queued',
  twilio_message_sid VARCHAR(50),
  failure_reason TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  twilio_error_code VARCHAR(20)
);

CREATE TABLE whatsapp_status_history (
  id SERIAL PRIMARY KEY,
  message_log_id INTEGER REFERENCES whatsapp_message_logs(id),
  twilio_message_sid VARCHAR(50),
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_code VARCHAR(20),
  error_message TEXT,
  event_type VARCHAR(50)
);
```

### Combined Send & Log Function

```typescript
export async function sendAndLogWhatsAppMessage(
  to: string,
  message: string,
  podName: string,
  sourceFeature: WhatsAppSourceFeature,
  recipientName?: string,
  options: SendWhatsAppOptions = { trackDelivery: true },
): Promise<WhatsAppSendResult> {
  // Validate phone number first
  const cleanTo = validateAndCleanPhoneNumber(to)

  if (!cleanTo) {
    const failureResult = {
      success: false,
      error: `Invalid phone number format: ${to}`,
    }

    // Log the failure
    await logWhatsAppMessage({
      pod_name: podName,
      recipient_name: recipientName || null,
      recipient_phone_number: to,
      source_feature: sourceFeature,
      message_content: message,
      delivery_status: 'failed',
      twilio_message_sid: null,
      failure_reason: failureResult.error,
    })

    return failureResult
  }

  // Send message
  const result = await sendWhatsAppMessage(cleanTo, message, options)

  // Log the attempt
  await logWhatsAppMessage({
    pod_name: podName,
    recipient_name: recipientName || null,
    recipient_phone_number: cleanTo,
    source_feature: sourceFeature,
    message_content: message,
    delivery_status: result.delivery_status ?? 'failed',
    twilio_message_sid: result.messageId || null,
    failure_reason: result.error || null,
  })

  return result
}
```

---

## 5. Status Callback Webhooks

### Purpose

Receive real-time delivery status updates from Twilio.

### Status Flow

```
queued → sending → sent → delivered → read
                      ↘ failed/undelivered
```

### Webhook Endpoint

```typescript
// app/api/whatsapp/status-callback/route.ts

export async function POST(request: NextRequest) {
  const formData = await request.formData()

  const payload = {
    MessageSid: formData.get('MessageSid') as string,
    MessageStatus: formData.get('MessageStatus') as string,
    ErrorCode: formData.get('ErrorCode') as string | undefined,
    ErrorMessage: formData.get('ErrorMessage') as string | undefined,
    EventType: formData.get('EventType') as string | undefined, // 'READ' for read receipts
  }

  // Validate status transition before updating
  if (isValidStatusTransition(currentStatus, newStatus)) {
    await updateMessageStatusWithHistory(payload.MessageSid, newStatus, {
      errorCode: payload.ErrorCode,
      errorMessage: payload.ErrorMessage,
      eventType: payload.EventType,
    })
  }

  // Always return 200 quickly (Twilio expects response within 15 seconds)
  return new Response('OK', { status: 200 })
}
```

### Status Transition Validation

Prevent out-of-order updates (race conditions):

```typescript
const STATUS_ORDER: Record<WhatsAppDeliveryStatus, number> = {
  accepted: 0,
  queued: 1,
  sending: 2,
  sent: 3,
  delivered: 4,
  read: 5,
  failed: 6,
  undelivered: 6,
}

export function isValidStatusTransition(
  currentStatus: WhatsAppDeliveryStatus,
  newStatus: WhatsAppDeliveryStatus,
): boolean {
  // Terminal statuses cannot be changed
  if (['read', 'failed', 'undelivered'].includes(currentStatus)) {
    return false
  }

  // New status must be "higher" in the flow
  return STATUS_ORDER[newStatus] > STATUS_ORDER[currentStatus]
}
```

### Configure Callback URL

When sending messages:

```typescript
const messageOptions = {
  from: 'whatsapp:+1234567890',
  to: 'whatsapp:+0987654321',
  contentSid: 'HXXXXXXXXXXX',
  contentVariables: JSON.stringify({ '1': 'Your message' }),
  statusCallback: 'https://yourdomain.com/api/whatsapp/status-callback',
}
```

---

## 6. Rate Limiting

### Twilio WhatsApp Limits

- **Per-second limit:** ~80 messages/second (varies by account)
- **Recommended:** 1 message per 100-200ms for safety

### Implementation

```typescript
const WHATSAPP_RATE_LIMITS = {
  MESSAGE_DELAY_MS: 100, // Delay between individual messages
  BATCH_SIZE: 50, // Messages per batch
  BATCH_DELAY_MS: 2000, // Delay between batches
}

export async function sendWhatsAppToMany(
  recipients: string[],
  message: string,
): Promise<Results[]> {
  const results = []

  for (let i = 0; i < recipients.length; i++) {
    const result = await sendWhatsAppMessage(recipients[i], message)
    results.push(result)

    // Rate limiting
    if (i < recipients.length - 1) {
      if ((i + 1) % BATCH_SIZE === 0) {
        await delay(BATCH_DELAY_MS) // Longer pause between batches
      } else {
        await delay(MESSAGE_DELAY_MS) // Short pause between messages
      }
    }
  }

  return results
}
```

---

## 7. Error Handling

### Common Twilio Errors

| Error                                        | Cause                                    | Solution                        |
| -------------------------------------------- | ---------------------------------------- | ------------------------------- |
| `The Content Variables parameter is invalid` | Special characters in template variables | Use single-line plain text      |
| `Channel with the specified From address`    | Number not WhatsApp-enabled              | Verify sender in Twilio Console |
| `not a valid phone number`                   | Invalid E.164 format                     | Validate before sending         |
| `Rate limit exceeded`                        | Too many messages too fast               | Implement rate limiting         |
| `Template not approved`                      | Using unapproved template                | Wait for Meta approval          |

### Error Handling Pattern

```typescript
try {
  const messageResponse = await client.messages.create(messageOptions)

  return {
    success: !messageResponse.errorCode,
    messageId: messageResponse.sid,
    delivery_status: messageResponse.status,
    error: messageResponse.errorMessage || undefined,
  }
} catch (error) {
  let errorMessage = error instanceof Error ? error.message : 'Unknown error'

  // Provide helpful messages for common issues
  if (errorMessage.includes('Channel with the specified From address')) {
    errorMessage = `The Twilio number is not WhatsApp-enabled.`
  } else if (errorMessage.includes('not a valid')) {
    errorMessage = `Invalid phone number format. Use E.164 format.`
  }

  return {
    success: false,
    error: errorMessage,
    delivery_status: 'failed',
  }
}
```

---

## 8. Green Checkmark Verification

### Requirements for Official Business Account (OBA)

The green checkmark requires:

1. **Meta Business Verification**
   - Verify at: business.facebook.com → Settings → Business Info
   - Provide legal documents (registration, tax ID, etc.)

2. **Apply for OBA Status**
   - Contact Twilio Support, or
   - Apply through Meta Business Help Center

3. **Eligibility Criteria**
   - Notable/well-known brand
   - Frequently searched
   - Risk of impersonation
   - Compliant with WhatsApp policies

### Reality Check

> Most legitimate businesses operate successfully **without** the green checkmark. Focus on:
>
> - Complete business profile (logo, description)
> - Consistent branding
> - Quality message content
> - Good delivery rates

---

## 9. Quick Reference Checklist

### Before Going Live

- [ ] **Twilio Console Setup**
  - [ ] WhatsApp sender configured
  - [ ] Business profile complete (photo, about, website)
  - [ ] Display name approved
  - [ ] Status callback webhook URL configured

- [ ] **Template Configuration**
  - [ ] Template created in Twilio Content API
  - [ ] Template approved by Meta/WhatsApp
  - [ ] Content variables use plain single-line text

- [ ] **Code Implementation**
  - [ ] Phone number validation (E.164)
  - [ ] Message logging to database
  - [ ] Status callback webhook endpoint
  - [ ] Rate limiting for bulk sends
  - [ ] Error handling with helpful messages
  - [ ] Status transition validation (prevent race conditions)

- [ ] **Testing**
  - [ ] Single message send works
  - [ ] Status updates received via webhook
  - [ ] Failed messages logged correctly
  - [ ] Bulk send respects rate limits

### Template Variable Rules

```
✅ DO:
- Use single-line strings
- Use plain alphanumeric text
- Keep under reasonable length (~1000 chars)

❌ DON'T:
- Use newlines (\n)
- Use asterisks (*)
- Use bullet points (•)
- Use emojis
- Use markdown formatting
```

---

## Environment Variables Required

```env
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+1234567890
WHATSAPP_STATUS_CALLBACK_URL=https://yourdomain.com/api/whatsapp/status-callback
```

---

## Additional Resources

- [Twilio Content API Documentation](https://www.twilio.com/docs/content/content-api-resources)
- [WhatsApp Business API Guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines)
- [Twilio WhatsApp Templates](https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates)
- [Meta Business Verification](https://www.facebook.com/business/help/1095661473946872)

---

_This guide was created based on real implementation issues encountered during development._
