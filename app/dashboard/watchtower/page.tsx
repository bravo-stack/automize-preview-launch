import {
  getAlertsPaginated,
  getRulesPaginated,
  getWatchtowerStats,
} from '@/lib/services/watchtower-service'
import WatchtowerContainer from './watchtower-container'

export default async function WatchTowerPage() {
  // Fetch initial data in parallel
  const [
    stats,
    { rules: recentRules },
    { rules: initialRules, total: totalRules },
    { alerts: initialAlerts, total: totalAlerts },
  ] = await Promise.all([
    getWatchtowerStats(),
    getRulesPaginated({ page: 1, pageSize: 5, sortBy: 'created_desc' }), // For "Recent Rules"
    getRulesPaginated({ page: 1, pageSize: 20 }), // For "Rules" tab
    getAlertsPaginated({ page: 1, pageSize: 20, sortBy: 'created_desc' }), // For "Alerts" tab
  ])

  return (
    <WatchtowerContainer
      initialStats={stats}
      initialRecentRules={recentRules}
      initialRules={{
        data: initialRules,
        pagination: {
          page: 1,
          pageSize: 20,
          totalCount: totalRules,
          totalPages: Math.ceil(totalRules / 20),
          hasNextPage: totalRules > 20,
          hasPrevPage: false,
        },
      }}
      initialAlerts={{
        data: initialAlerts,
        pagination: {
          page: 1,
          pageSize: 20,
          totalCount: totalAlerts,
          totalPages: Math.ceil(totalAlerts / 20),
          hasNextPage: totalAlerts > 20,
          hasPrevPage: false,
        },
      }}
    />
  )
}