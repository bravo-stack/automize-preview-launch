// lib/omnisendClient.ts

const OMNISEND_API_KEY = process.env.OMNISEND_API_KEY!
const BASE_URL = 'https://api.omnisend.com'

if (!OMNISEND_API_KEY) {
  throw new Error('Missing OMNISEND_API_KEY in environment variables')
}

export class OmnisendClient {
  static async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000) // 15s

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': OMNISEND_API_KEY,
          ...(options.headers || {}),
        },
        signal: controller.signal,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(
          `Omnisend API error: ${res.status} ${res.statusText} - ${JSON.stringify(errorData)}`,
        )
      }

      return res.json()
    } catch (err: any) {
      if (err.name === 'AbortError')
        throw new Error('Omnisend API request timed out')
      throw err
    } finally {
      clearTimeout(timeout)
    }
  }
}
