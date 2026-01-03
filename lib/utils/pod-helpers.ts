// Pod Helper Utilities

// Normalize pod name for use in channel names
// Handles cases like "inti (b team)" -> "inti", "puly game" -> "puly"
export function normalizePodNameForChannel(podName: string): string {
  if (!podName) return ''

  // Take only the first word (before any space or special character)
  const firstWord = podName.split(/[\s\(\[]/)[0]

  // Lowercase and remove any remaining special characters
  return firstWord.toLowerCase().replace(/[^a-z0-9-]/g, '')
}

// Build the to-do-list channel name for a pod
export function buildToDoListChannelName(podName: string): string {
  const normalized = normalizePodNameForChannel(podName)
  return `${normalized}-to-do-list`
}
