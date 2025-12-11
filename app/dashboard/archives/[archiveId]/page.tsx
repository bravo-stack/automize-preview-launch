import { Space_Grotesk } from 'next/font/google'

import { ArchiveDetail } from './_components/archive-detail'

const archivesFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ixm-archives',
})

interface ArchiveDetailPageProps {
  params: { archiveId: string }
}

export default function ArchiveDetailPage({ params }: ArchiveDetailPageProps) {
  return (
    <ArchiveDetail
      archiveId={params.archiveId}
      fontClass={archivesFont.className}
    />
  )
}
