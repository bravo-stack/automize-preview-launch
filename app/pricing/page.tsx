import Faq from '@/components/Faq'
import Link from 'next/link'

export default function Home() {
  const cube = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="inline-block size-5"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
        clipRule="evenodd"
      />
    </svg>
  )

  const services = [
    {
      name: 'Autometrics',
      desc: [
        { svg: cube, text: 'Syncs Facebook and Shopify ads.' },
        { svg: cube, text: 'Visualizes ad data in Sheets.' },
        { svg: cube, text: 'Automates reporting processes.' },
        { svg: cube, text: 'Real-time ad analytics.' },
        { svg: cube, text: 'Share insights easily.' },
      ],
      link: '/pricing/autometrics',
      price: 19,
    },
    {
      name: 'AI Consultant',
      desc: [
        { svg: cube, text: 'Personalized AI consulting services.' },
        { svg: cube, text: 'Advanced NLP interactions.' },
        { svg: cube, text: 'Tailored AI solutions.' },
        { svg: cube, text: 'AI-driven business strategies.' },
        { svg: cube, text: '24/7 support and assistance.' },
      ],
      link: '/pricing/aiconsultant',
      price: 29,
    },
    {
      name: 'Business Optimizer',
      desc: [
        { svg: cube, text: 'Optimizes business operations.' },
        { svg: cube, text: 'Boosts efficiency and productivity.' },
        { svg: cube, text: 'Data-driven decision making.' },
        { svg: cube, text: 'Tracks business performance.' },
        { svg: cube, text: 'Ongoing support and adjustments.' },
      ],
      link: '/pricing/businessoptimizer',
      price: 25,
    },
  ]

  const faqs = [
    {
      question: 'What is Autometrics?',
      answer:
        'Autometrics syncs your Facebook and Shopify ad data into Google Sheets for easy visualization and real-time analytics.',
    },
    {
      question: 'How does the AI Consultant work?',
      answer:
        'Our AI Consultant uses advanced NLP to interact with clients, providing tailored AI solutions and 24/7 support.',
    },
    {
      question: 'How can I contact sales?',
      answer:
        'You can contact our sales team through the "Contact Sales" button or by visiting our pricing page.',
    },
    {
      question: 'Do you offer custom solutions?',
      answer:
        'Yes, we offer custom solutions tailored to your business needs. Contact us to learn more.',
    },
  ]

  return (
    <main className="flex min-h-screen flex-col items-center justify-between scroll-smooth bg-night-twilight p-10 md:p-24">
      <header className="mb-32 flex flex-col gap-5">
        <hgroup className="z-10 flex flex-col items-center justify-center space-y-2 text-center">
          <h1 className="text-4xl font-bold tracking-wide">
            Find a service to power your business.
          </h1>
          <h2 className="text-lg text-white/70">
            From early-stage teams to growing enterprises, Automize has you
            covered.
          </h2>
        </hgroup>
      </header>

      <article id="info" className="space-y-48">
        <section className="space-y-10">
          <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.name}
                className="group flex h-full flex-col justify-between space-y-3 rounded-xl border border-zinc-800 bg-gradient-to-tr from-zinc-900/10 via-zinc-500/10 to-zinc-900/10 p-5 transition-colors hover:border-zinc-700 md:p-10"
              >
                <h4 className="text-2xl font-semibold tracking-wide">
                  {service.name}
                </h4>

                {service.price && (
                  <p className="text-md">Starting at ${service.price}/month</p>
                )}

                <ul className="space-y-2">
                  {service.desc.map((desc, index) => (
                    <li key={index}>
                      {desc.svg}{' '}
                      <span className="text-sm text-white/80">{desc.text}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={service.link ?? '/pricing/sales'}
                  className="group/btn border-dusk flex select-none justify-between rounded-lg border px-4 py-2 transition-all hover:bg-white hover:text-black group-hover:translate-y-1 group-hover:scale-[1.02]"
                >
                  <span>{service.price ? 'Learn More' : 'Contact Sales'}</span>

                  <div className="flex items-center opacity-50 transition-opacity group-hover/btn:opacity-100">
                    <svg
                      role="img"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="-mr-2.5 h-2.5 w-0 transform-gpu transition-all duration-200 ease-out group-hover/btn:w-2.5"
                    >
                      <path d="M1 9h14a1 1 0 000-2H1a1 1 0 000 2z"></path>
                    </svg>
                    <svg
                      role="img"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="size-2.5"
                    >
                      <path d="M7.293 1.707L13.586 8l-6.293 6.293a1 1 0 001.414 1.414l7-7a.999.999 0 000-1.414l-7-7a1 1 0 00-1.414 1.414z"></path>
                    </svg>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto my-10 max-w-2xl p-5">
          <hgroup className="text-center">
            <h2 className="font-semibold">Have Questions?</h2>
            <h1 className="mb-10 text-3xl font-bold">FAQ</h1>
          </hgroup>

          <Faq faqs={faqs} />
        </section>
      </article>
    </main>
  )
}
