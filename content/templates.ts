export const templates = [
  [
    [
      'Name',
      'Pod',
      'Monitored',
      'CPA',
      'Ad Spend',
      'CPC',
      'CPM',
      'CTR',
      'Quality Ranking',
      'ERR',
      'CRR',
      'ROAS',
      'Hook Rate',
      'Bounce Rate',
      'LC/ATC%',
      'ATC/IC%',
      'IC/PUR%',
    ],
  ],
  [['Name', 'Monitored', 'ROAS', 'Impressions']],
  [
    [
      'Name',
      'Pod',
      'Monitored',
      'Revenue',
      'Ad spend',
      'Revenue since rebill',
      'Ad spend since rebill',
      'ROAS',
      'ROAS since rebill',
      'Is Rebillable',
      'Last Rebill Date',
      'Next Rebill',
    ],
  ],
]

export function getTemplateById(id: number) {
  return templates[id - 1]
}
