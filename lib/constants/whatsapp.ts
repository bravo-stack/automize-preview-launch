/**
 * WhatsApp Constants
 * Pre-approved template Content SIDs and other WhatsApp configuration
 */

// Pre-approved WhatsApp Template Content SIDs (loaded from environment)
export const WHATSAPP_TEMPLATES = {
  /** Generic alert template - single variable for alert content */
  ACCOUNT_ALERT: process.env.TWILIO_WHATSAPP_ALERT_TEMPLATE_SID || '',
} as const

export type WhatsAppTemplateKey = keyof typeof WHATSAPP_TEMPLATES
