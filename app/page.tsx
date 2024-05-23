import Image from 'next/image'

export default function Home() {
  return (
    <main className="flex bg-[#0f0f0f] min-h-screen flex-col items-center justify-between p-24">
      <hgroup className="text-center mt-10">
        <h1 className="text-4xl tracking-wide font-bold">
          <span className="text">Automize</span> your work
        </h1>
        <h2 className="text-lg font-semibold">Optimize your costs</h2>
      </hgroup>
    </main>
  )
}
