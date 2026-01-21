export const WHATSAPP_TEMPLATES = {
  AD_ACCOUNT_ALERT: {
    contentSid:
      process.env.WHATSAPP_TEMPLATE_AD_ACCOUNT_ALERT ||
      'HXdbb03fddccfc1ff05227790faccd252e',
    name: 'ad_account_alert',
  },
  DAILY_SUMMARY_REPORT: {
    contentSid:
      process.env.WHATSAPP_TEMPLATE_DAILY_SUMMARY_REPORT ||
      'HX9d530d87e86c7c6f0ece69147cf5abd7',
    name: 'daily_summary_report',
  },
  WATCHTOWER_NOTIFICATION: {
    contentSid:
      process.env.WHATSAPP_TEMPLATE_WATCHTOWER_NOTIFICATION ||
      'HX59bcd2b3f588c2ce6ada30ecc3201a9a',
    name: 'watchtower_notification',
  },
  LATE_RESPONSE_ALERT: {
    contentSid:
      process.env.WHATSAPP_TEMPLATE_LATE_RESPONSE_ALERT ||
      'HX5b76a7c08d84dee96e9985bca42afb7f',
    name: 'late_response_alert',
  },
  UNRESPONDED_CLIENT_ALERT: {
    contentSid:
      process.env.WHATSAPP_TEMPLATE_UNRESPONDED_CLIENT_ALERT ||
      'HXe261dbd43f09ccb8a80d865e66fa0e04',
    name: 'unresponded_client_alert',
  },
}
