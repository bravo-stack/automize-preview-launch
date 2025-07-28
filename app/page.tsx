'use client'

import Footer from '@/components/Footer'
import Hero from '@/components/Hero'
import Nav from '@/components/Nav' // Assuming Nav component
import { ShootingStars } from '@/components/shooting-stars'
import { StarsBackground } from '@/components/stars-background'

// DATA INIT
const services = [
  {
    name: 'Autometrics',
    desc: [
      'Syncs Facebook and Shopify ads',
      'Visualizes ad data in Sheets',
      'Automates reporting processes',
      'Real-time ad analytics',
      'Share insights easily',
    ],
    link: '/signup?plan=autometrics',
    price: 19,
    isPopular: false,
  },
  {
    name: 'AI Consultant',
    desc: [
      'Personalized AI consulting services',
      'Advanced NLP interactions',
      'Tailored AI solutions',
      'AI-driven business strategies',
      '24/7 priority support',
    ],
    link: '/signup?plan=aiconsultant',
    price: 29,
    isPopular: true,
  },
  {
    name: 'Business Optimizer',
    desc: [
      'Optimizes business operations',
      'Boosts efficiency and productivity',
      'Data-driven decision making',
      'Tracks business performance',
      'Ongoing support and adjustments',
    ],
    link: '/signup?plan=optimizer',
    price: 25,
    isPopular: false,
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
    question: 'Can I change my plan later?',
    answer:
      'Yes, you can upgrade, downgrade, or cancel your plan at any time from your account dashboard. Changes will be prorated.',
  },
  {
    question: 'Do you offer custom enterprise solutions?',
    answer:
      'Absolutely. We offer custom solutions tailored to your business needs, including dedicated support and infrastructure. Please contact our sales team to learn more.',
  },
]

export default function EnterpriseLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-tr from-night-twilight via-night-starlit to-night-dusk text-zinc-50">
      <Nav />

      <main className="container relative z-50 mx-auto px-4">
        {/* Section 1: Hero */}
        <Hero />

        {/* Section 2: Features */}
        {/* <section id="features" className="py-16 sm:py-24">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
              Transform Your Operations
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Our platform is more than just automation. It&apos;s an integrated
              ecosystem designed to solve your most critical business
              challenges.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<Bot className="h-6 w-6" />}
              title="Intelligent Process Automation"
              description="Deploy autonomous AI agents to handle repetitive tasks, from data entry to complex decision-making, with unparalleled accuracy."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Seamless Integration"
              description="Connect with hundreds of enterprise applications out-of-the-box. Our robust API ensures a frictionless integration with your existing tech stack."
            />
            <FeatureCard
              icon={<BarChart className="h-6 w-6" />}
              title="Actionable Analytics"
              description="Gain deep insights into your operations with real-time dashboards and predictive analytics, turning data into strategic advantage."
            />
          </div>
        </section> */}

        {/* Section 3: Pricing - NEWLY ADDED */}
        {/* <section id="pricing" className="py-16 sm:py-24">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
              Flexible Pricing for Teams of All Sizes
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Choose the perfect plan to automate your workflows and scale your
              business. All plans come with a 14-day free trial.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card
                key={service.name}
                className={`flex flex-col border-zinc-800 bg-black/50 backdrop-blur-md ${
                  service.isPopular ? 'border-blue-600' : ''
                }`}
              >
                <CardHeader className="relative">
                  {service.isPopular && (
                    <Badge className="absolute -top-7 right-4 hover:opacity-80 bg-blue-600 text-white">
                      Most Popular
                    </Badge>
                  )}
                  <CardTitle className="text-2xl font-semibold text-zinc-200">
                    {service.name}
                  </CardTitle>
                  <CardDescription className="flex items-baseline gap-2 pt-2">
                    <span className="text-4xl font-bold text-zinc-50">
                      ${service.price}
                    </span>
                    <span className="text-zinc-400">/ month</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <p className="text-sm text-zinc-400">Includes:</p>
                  <ul className="space-y-3">
                    {service.desc.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 flex-shrink-0 text-blue-500" />
                        <span className="text-zinc-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    asChild
                    className={`w-full text-white ${
                      service.isPopular
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-zinc-800 hover:bg-zinc-700'
                    }`}
                  >
                    <Link href={service.link}>Get Started</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section> */}

        {/* Section 4: Social Proof / Testimonials */}
        {/* <section id="testimonials" className="py-16 sm:py-24">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
              Trusted by Industry Leaders
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              We empower innovative companies to redefine what&apos;s possible.
            </p>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <TestimonialCard
              quote="The automation capabilities have fundamentally changed how we operate, saving us thousands of hours and allowing our team to focus on strategic initiatives. It's a game-changer."
              author="Jane Doe"
              title="Chief Operating Officer"
              company="Global Tech Inc."
            />
            <TestimonialCard
              quote="The platform's reliability and scalability are second to none. We migrated from a legacy system, and the transition was seamless. The performance improvements are remarkable."
              author="John Smith"
              title="VP of Engineering"
              company="Innovate Solutions"
            />
          </div>
        </section> */}

        {/* Section 5: FAQ - NEWLY ADDED */}
        {/* <section id="faq" className="mx-auto my-16 max-w-3xl sm:my-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Have questions? We have answers. If you can&apos;t find what
              you&apos;re looking for, feel free to contact us.
            </p>
          </div>
          <Accordion type="single" collapsible className="mt-12 w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-lg text-zinc-100 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-zinc-400">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section> */}

        {/* Section 6: Final CTA */}
        {/* <section
          id="finalCTA"
          className="my-24 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-black py-16 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl">
            Ready to Elevate Your Business?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
            Discover how our automation platform can be tailored to your
            specific needs. Schedule a personalized demo with our solutions
            experts today.
          </p>
          <div className="mt-8">
            <Button
              asChild
              size="lg"
              className="bg-blue-600 px-8 text-white hover:bg-blue-700"
            >
              <Link href="/dashboard">Get Started Now</Link>
            </Button>
          </div>
        </section> */}
      </main>

      <Footer />

      <ShootingStars />
      <StarsBackground />
    </div>
  )
}
