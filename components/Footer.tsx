import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="py-5">
      <p className="text-center text-xs text-zinc-500">
        An InsightX Media service developed by{' '}
        <a
          className="font-bold tracking-tighter underline"
          href="https://www.arekos.com/"
        >
          Arekos
        </a>
      </p>
    </footer>
  )
}
