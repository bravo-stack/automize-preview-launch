import Cycle from '@/components/Cycle'
import Solutions from '@/components/Solutions'
import Link from 'next/link'

export default async function Home() {

  return (
    <main className="flex min-h-screen flex-col items-center justify-between scroll-smooth">
      <header className="mb-20 flex min-h-[65vh] w-full flex-col gap-5 border-b-2 border-night-dusk bg-gradient-to-b from-night-twilight via-night-dusk/80 to-night-twilight px-6 pt-10 md:px-20">
        <hgroup className="z-10 flex flex-col space-y-2">
          <h1 className="text-transparen from-white via-zinc-700/90 to-white/60 bg-clip-text text-6xl tracking-wide">
            <span className="text-transparen from-white via-gray-700/90 to-white/60 bg-clip-text text-5xl font-bold tracking-wide">
              Automize
            </span>
            <Cycle />
          </h1>
          <h2 className="text-lg font-semibold text-white/90 lg:w-3/5">
            A full stack automation agency centered on reducing your
            business&apos;s costs and boosting your performance.
          </h2>
        </hgroup>

        <div className="flex items-center justify-center">
          <button className="mt-10">
            <Link href="#info" className="btn hover:insane">
              What We Do{' '}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="inline-block size-4 animate-bounce"
              >
                <path
                  fillRule="evenodd"
                  d="M7.47 12.78a.75.75 0 0 0 1.06 0l3.25-3.25a.75.75 0 0 0-1.06-1.06L8 11.19 5.28 8.47a.75.75 0 0 0-1.06 1.06l3.25 3.25ZM4.22 4.53l3.25 3.25a.75.75 0 0 0 1.06 0l3.25-3.25a.75.75 0 0 0-1.06-1.06L8 6.19 5.28 3.47a.75.75 0 0 0-1.06 1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </button>
        </div>
      </header>

      <article id="info" className="space-y-48 p-10 md:p-24">
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
            <h3 className="md:w-3/5">
              Automize specializes in automating and optimizing your work flow.
              Employ our robust solutions to your businesses in just a few
              clicks.
            </h3>
          </hgroup>

          <Solutions />
        </section>

        {/* <section className="space-y-10">
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
        </section> */}
      </article>
    </main>
  )
}
