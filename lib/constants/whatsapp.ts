/**
 * WhatsApp Constants
 * Pre-approved template Content SIDs and other WhatsApp configuration
 */

// Pre-approved WhatsApp Template Content SIDs
export const WHATSAPP_TEMPLATES = {
  /** Generic alert template - single variable for alert content */
  ACCOUNT_ALERT: 'HX5ca49cb559c5a6d40bc2664aa3ac1a5b',
} as const

export type WhatsAppTemplateKey = keyof typeof WHATSAPP_TEMPLATES
