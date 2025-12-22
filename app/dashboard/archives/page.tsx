import { Space_Grotesk } from 'next/font/google'

import ArchiveDirectory from './components/archive-directory'

const archivesFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ixm-archives',
})

export default function ArchivesPage() {
  return <ArchiveDirectory fontClass={archivesFont.className} />
}
