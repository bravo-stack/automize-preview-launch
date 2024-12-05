import { createServerClient } from '@supabase/ssr'

export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ADMIN_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
      },
    },
  )
}
