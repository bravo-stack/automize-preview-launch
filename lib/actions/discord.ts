'use server'

const DISCORD_API_URL = 'https://ixm-bot.onrender.com/api/sendMessage'

export async function sendDiscordMessage(channelName: string, message: string) {
  try {
    const response = await fetch(DISCORD_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelName, message }),
    })

    if (!response.ok) {
      console.error(
        `Failed to send message to Discord channel "${channelName}". Status: ${response.status}`,
      )
    }
  } catch (error) {
    console.error(
      `Error sending message to Discord channel "${channelName}":`,
      error,
    )
  }
}
