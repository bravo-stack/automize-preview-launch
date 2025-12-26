// lib/omnisendClient.ts
const BASE_URL = 'https://api.omnisend.com'

export class OmnisendClient {
  static async request<T>(
    apiKey: string,
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    if (!apiKey) {
      throw new Error('Omnisend API key is required')
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000) // 15s

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
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
