import ExternalLink from '@/components/ExternalLink'
import Nav from '@/components/Nav'
import { ShootingStars } from '@/components/shooting-stars'
import { StarsBackground } from '@/components/stars-background'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, BarChart, Bot, Zap } from 'lucide-react'
import Link from 'next/link'

// It's best practice to create these as separate components
// For this example, they are defined within the same file for simplicity.

const FeatureCard = ({ icon, title, description }) => (
  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400">
      {icon}
    </div>
    <h3 className="mb-2 text-xl font-semibold text-zinc-100">{title}</h3>
    <p className="text-zinc-400">{description}</p>
  </div>
)

const TestimonialCard = ({ quote, author, title, company }) => (
  <figure className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
    <blockquote className="text-lg italic text-zinc-300">
      &quot;{quote}&quot;
    </blockquote>
    <figcaption className="mt-4 border-t border-zinc-800 pt-4">
      <div className="font-semibold text-zinc-100">{author}</div>
      <div className="text-sm text-zinc-400">
        {title}, {company}
      </div>
    </figcaption>
  </figure>
)

export default function EnterpriseLandingPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-50">
      {/* Navigation would go here */}
      <Nav />

      <main className="container mx-auto px-4">
        {/* Section 1: Hero */}
        <section
          id="hero"
          className="flex flex-col gap-1 py-32 text-center sm:py-36 md:gap-4 md:py-52"
        >
          <Badge
            variant="secondary"
            className="mx-auto mb-6 w-fit border-blue-500/30 bg-blue-950/40 text-sm font-medium text-blue-300"
          >
            An Enterprise-Grade Solution by Automize
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tighter text-zinc-100 sm:text-5xl md:text-6xl lg:text-7xl">
            The New Standard in
            <span className="block bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
              Business Automation
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400 sm:text-xl">
            Leverage our cutting-edge AI platform to streamline complex
            workflows, drive efficiency, and unlock unprecedented growth. Built
            for scale, security, and performance.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Link href="/dashboard">
                Request a Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <ExternalLink
                className="text-blue-500 hover:text-blue-600"
                href="https://www.arekos.com/"
              >
                Contact Sales
              </ExternalLink>
            </Button>
          </div>
        </section>

        {/* Section 2: Features */}
        <section id="features" className="py-16 sm:py-24">
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
        </section>

        {/* Section 3: Social Proof / Testimonials */}
        <section id="testimonials" className="py-16 sm:py-24">
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
        </section>

        {/* Section 4: Final CTA */}
        <section
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
              className="bg-blue-600 px-8 hover:bg-blue-700"
            >
              <Link href="/dashboard">Get Started Now</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-zinc-500">
          <p>
            &copy; {new Date().getFullYear()} InsightX Media. All Rights
            Reserved.
          </p>
          <p className="mt-1">
            A service proudly developed by{' '}
            <a
              href="https://www.arekos.com/"
              className="font-medium text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline"
            >
              Arekos
            </a>
          </p>
        </div>
      </footer>

      <ShootingStars />
      <StarsBackground />
    </div>
  )
}
