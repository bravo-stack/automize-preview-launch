export default function Section({
  children,
  title = 'Section',
  actions = <></>,
}) {
  return (
    <section className="mx-auto max-w-4xl divide-y divide-zinc-800 overflow-hidden rounded-md border border-zinc-800 2xl:mx-0 2xl:max-w-none">
      <div className="flex items-center justify-between bg-night-starlit px-5 py-2.5">
        <h2 className="text-lg font-semibold tracking-tighter">{title}</h2>
        {actions}
      </div>
      <div className="overflow-auto">{children}</div>
    </section>
  )
}
