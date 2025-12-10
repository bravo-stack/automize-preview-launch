import { createAdminClient } from '@/lib/db/admin'
import WatchtowerContainer from './watchtower-container'

export default async function WatchTowerPage() {
  const db = await createAdminClient()

  const { data: pods, error } = await db
    .from('pod')
    .select('id, name, discord_id')
    .order('name', { ascending: true })

  return <WatchtowerContainer />
}
