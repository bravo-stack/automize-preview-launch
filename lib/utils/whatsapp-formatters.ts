// ============================================================================
// WhatsApp Message Formatting Utilities
// ============================================================================
// Pure formatting functions (no server actions)
// ============================================================================

export function formatSummaryMessage(
  customMessage: string,
  clients: string[],
): string {
  if (clients.length === 0) {
    return `${customMessage}\n\n✅ All clients have been responded to!`
  }

  const clientList = clients.map((client) => `• ${client}`).join('\n')

  return `${customMessage}\n\nClient List:\n${clientList}`
}

export function formatAdErrorMessage(
  brandName: string,
  errorType: string,
  daysSinceDetected: number,
): string {
  const urgency = daysSinceDetected > 3 ? '🚨 URGENT' : '⚠️ Alert'

  return `${urgency}: Ad Account Error

Brand: ${brandName}
Error: ${errorType}
Days Active: ${daysSinceDetected}

Please check the ad account and resolve the issue.`
}
