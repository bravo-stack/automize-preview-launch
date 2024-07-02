export const templates = [
  [
    [
      'Name',
      'Pod',
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
  [['Name', 'ROAS', 'Impressions']],
]

export function getTemplateById(id: number) {
  return templates[id - 1]
}
