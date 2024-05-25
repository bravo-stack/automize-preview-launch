import Cycle from '@/components/Cycle'
import Solutions from '@/components/Solutions'
import Testimonial from '@/components/Testimonial'

export default function Home() {
  const getRandomOpacity = () => {
    const opacities = [
      'border-zinc-900/50',
      'border-zinc-900/70',
      'border-zinc-900/90',
    ]
    const randomIndex = Math.floor(Math.random() * opacities.length)
    return opacities[randomIndex]
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-[#0f0f0f] p-24">
      <header className="mb-72">
        <hgroup className="z-10 mt-10 flex flex-col items-center justify-center space-y-2 text-center">
          <h1 className="text-6xl font-bold tracking-wide">
            <span className="">Automize</span> <Cycle />
          </h1>
          <h2 className="w-3/5 text-lg font-semibold text-white/90">
            A full stack automation agency centered on reducing your
            business&apos;s costs and boosting your performance.
          </h2>
        </hgroup>

        <div className="absolute left-0 top-24 grid grid-cols-5 text-white">
          {[...Array(30)].map((index) => (
            <div
              key={index}
              className={`h-16 w-16 border first-letter:shadow-md ${getRandomOpacity()}`}
            ></div>
          ))}
        </div>

        <div className="absolute right-0 top-24 grid grid-cols-5 text-white">
          {[...Array(30)].map((index) => (
            <div
              key={index}
              className={`h-16 w-16 border shadow-md ${getRandomOpacity()}`}
            ></div>
          ))}
        </div>
      </header>

      <article className="space-y-48">
        <section className="space-y-20">
          <hgroup className="flex flex-col items-center justify-center space-y-2 text-center">
            <h3 className="w-fit rounded-full border border-fuchsia-500 bg-fuchsia-600/15 px-3 py-1.5 font-semibold">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="inline-block size-4"
              >
                <path
                  fillRule="evenodd"
                  d="M9.58 1.077a.75.75 0 0 1 .405.82L9.165 6h4.085a.75.75 0 0 1 .567 1.241l-6.5 7.5a.75.75 0 0 1-1.302-.638L6.835 10H2.75a.75.75 0 0 1-.567-1.241l6.5-7.5a.75.75 0 0 1 .897-.182Z"
                  clipRule="evenodd"
                />
              </svg>{' '}
              Our Solutions
            </h3>
            <h2 className="text-4xl font-semibold tracking-wide">
              Your Costs Cut Down
            </h2>
            <h3 className="w-3/5">
              Automize specializes in automating and optimizing your work flow.
              Employ our robust solutions to your businesses in just a few
              clicks.
            </h3>
          </hgroup>

          <Solutions />
        </section>

        <section className="space-y-10">
          <hgroup className="flex flex-col items-center justify-center space-y-2">
            <h2 className="w-fit rounded-full border border-fuchsia-500 bg-fuchsia-600/15 px-3 py-1.5 font-semibold">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="inline-block size-4"
              >
                <path
                  fillRule="evenodd"
                  d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.15-.043l4.25-5.5Z"
                  clipRule="evenodd"
                />
              </svg>{' '}
              Testimonials
            </h2>
            <h3>Why we are the last consultant agency you will ever need.</h3>
          </hgroup>

          <Testimonial />
        </section>

        <section className="">
          <hgroup className="flex flex-col items-center justify-center space-y-2">
            <h2 className="w-fit rounded-full border border-fuchsia-500 bg-fuchsia-600/15 px-3 py-1.5 font-semibold">
              Resources
            </h2>
            <h3>Why we are the last consultant agency you will ever need.</h3>
          </hgroup>
        </section>
      </article>
    </main>
  )
}
