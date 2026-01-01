export interface DiscordMessagePayload {
  channelId: string
  content?: string
  embeds?: Array<any>
}

export interface DiscordMessageResponse {
  success: boolean
  message: string
  channel: {
    id: string
    name: string
  }
  timestamp: string
}

export async function sendDiscordMessage(
  payload: DiscordMessagePayload,
): Promise<DiscordMessageResponse> {
  if (!process.env.IXM_BOT_API_URL || !process.env.IXM_BOT_API_KEY) {
    console.error('Missing Discord Bot configuration')
    throw new Error('Missing Discord Bot configuration')
  }

  try {
    const response = await fetch(process.env.IXM_BOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.IXM_BOT_API_KEY,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to send Discord message')
    }

    return (await response.json()) as DiscordMessageResponse
  } catch (error) {
    console.error('Error sending Discord notification:', error)
    throw error
  }
}
