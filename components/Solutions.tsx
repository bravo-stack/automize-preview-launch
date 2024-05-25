'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

export default function Solutions() {
  const arrow = (colour?: string) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`inline-block size-6 ${colour}`}
    >
      <path
        fillRule="evenodd"
        d="M15.22 6.268a.75.75 0 0 1 .968-.431l5.942 2.28a.75.75 0 0 1 .431.97l-2.28 5.94a.75.75 0 1 1-1.4-.537l1.63-4.251-1.086.484a11.2 11.2 0 0 0-5.45 5.173.75.75 0 0 1-1.199.19L9 12.312l-6.22 6.22a.75.75 0 0 1-1.06-1.061l6.75-6.75a.75.75 0 0 1 1.06 0l3.606 3.606a12.695 12.695 0 0 1 5.68-4.974l1.086-.483-4.251-1.632a.75.75 0 0 1-.432-.97Z"
        clipRule="evenodd"
      />
    </svg>
  )

  const cube = (colour?: string) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`inline-block size-6 ${colour}`}
    >
      <path
        fillRule="evenodd"
        d="M11.622 1.602a.75.75 0 0 1 .756 0l2.25 1.313a.75.75 0 0 1-.756 1.295L12 3.118 10.128 4.21a.75.75 0 1 1-.756-1.295l2.25-1.313ZM5.898 5.81a.75.75 0 0 1-.27 1.025l-1.14.665 1.14.665a.75.75 0 1 1-.756 1.295L3.75 8.806v.944a.75.75 0 0 1-1.5 0V7.5a.75.75 0 0 1 .372-.648l2.25-1.312a.75.75 0 0 1 1.026.27Zm12.204 0a.75.75 0 0 1 1.026-.27l2.25 1.312a.75.75 0 0 1 .372.648v2.25a.75.75 0 0 1-1.5 0v-.944l-1.122.654a.75.75 0 1 1-.756-1.295l1.14-.665-1.14-.665a.75.75 0 0 1-.27-1.025Zm-9 5.25a.75.75 0 0 1 1.026-.27L12 11.882l1.872-1.092a.75.75 0 1 1 .756 1.295l-1.878 1.096V15a.75.75 0 0 1-1.5 0v-1.82l-1.878-1.095a.75.75 0 0 1-.27-1.025ZM3 13.5a.75.75 0 0 1 .75.75v1.82l1.878 1.095a.75.75 0 1 1-.756 1.295l-2.25-1.312a.75.75 0 0 1-.372-.648v-2.25A.75.75 0 0 1 3 13.5Zm18 0a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-.372.648l-2.25 1.312a.75.75 0 1 1-.756-1.295l1.878-1.096V14.25a.75.75 0 0 1 .75-.75Zm-9 5.25a.75.75 0 0 1 .75.75v.944l1.122-.654a.75.75 0 1 1 .756 1.295l-2.25 1.313a.75.75 0 0 1-.756 0l-2.25-1.313a.75.75 0 1 1 .756-1.295l1.122.654V19.5a.75.75 0 0 1 .75-.75Z"
        clipRule="evenodd"
      />
    </svg>
  )

  const tabs = useMemo(
    () => [
      {
        label: 'AutoMetric',
        svg: arrow(),
        content: {
          svg: {
            code: arrow('text-cyan-500'),
            border: 'border-cyan-500',
            bg: 'bg-cyan-500/20',
          },
          label: { text: 'AutoMetric', colour: 'text-cyan-500' },
          header: 'Handle your ad traffic with ease.',
          description:
            'Streamline your business through organized insights into your ad traffic.',
        },
      },
      {
        label: 'InsightPro',
        svg: cube(),
        content: {
          svg: {
            code: cube('text-purple-500'),
            border: 'border-purple-500',
            bg: 'bg-purple-500/20',
          },
          label: { text: 'InsightPro', colour: 'text-purple-500' },
          header: 'Unlock the Power of Data Analytics',
          description:
            'Gain deep insights into your business performance with our advanced analytics tools, designed to help you make informed decisions.',
        },
      },
      {
        label: 'StreamFlow',
        svg: cube(),
        content: {
          svg: {
            code: cube('text-green-500'),
            border: 'border-green-500',
            bg: 'bg-green-500/20',
          },
          label: { text: 'StreamFlow', colour: 'text-green-500' },
          header: 'Optimize Your Workflow Effortlessly',
          description:
            'Enhance productivity and streamline your operations with our state-of-the-art workflow management solution.',
        },
      },
      {
        label: 'MarketPulse',
        svg: cube(),
        content: {
          svg: {
            code: cube('text-yellow-500'),
            border: 'border-yellow-500',
            bg: 'bg-yellow-500/20',
          },
          label: { text: 'MarketPulse', colour: 'text-yellow-500' },
          header: 'Stay Ahead with Real-Time Market Insights',
          description:
            'Keep your finger on the pulse of the market with our comprehensive real-time data and analysis tools.',
        },
      },
    ],
    [],
  )

  const [selectedTab, setSelectedTab] = useState(0)
  const tabRefs = useRef<HTMLButtonElement[]>([])
  const [highlightStyle, setHighlightStyle] = useState({})

  const updateHighlightStyle = useCallback(() => {
    if (tabRefs.current[selectedTab]) {
      const { offsetWidth, offsetHeight, offsetLeft, offsetTop } =
        tabRefs.current[selectedTab]
      setHighlightStyle({
        width: `${offsetWidth}px`,
        height: `${offsetHeight}px`,
        transform: `translate(${offsetLeft}px, ${offsetTop}px)`,
      })
    }
  }, [selectedTab, setHighlightStyle, tabRefs])

  useEffect(() => {
    updateHighlightStyle()
    const handleResize = () => {
      updateHighlightStyle()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [selectedTab, tabs, updateHighlightStyle])

  const handleTabClick = (index: number) => {
    setSelectedTab(index)
  }

  return (
    <div className="flex flex-col items-center">
      <nav className="relative grid w-full grid-cols-1 gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-1.5 md:w-4/5 md:grid-cols-4 md:rounded-full">
        {tabs.map((tab, index) => (
          <button
            key={index}
            ref={(el) => {
              if (el) {
                tabRefs.current[index] = el
              }
            }}
            className={`z-10 flex-grow px-4 py-2 text-left transition-colors md:py-4 md:text-center ${
              selectedTab === index ? 'text-white' : 'text-gray-400'
            }`}
            onClick={() => handleTabClick(index)}
          >
            {tab.svg} {tab.label}
          </button>
        ))}
        <div
          className={`absolute rounded-2xl bg-zinc-400/10 transition-all duration-300 ease-in-out md:rounded-full`}
          style={highlightStyle}
        />
      </nav>

      <div className="mt-10 w-full md:w-4/5">
        <div className="flex flex-col space-y-10 md:flex-row md:justify-between md:space-y-0">
          <div className="flex w-full flex-col justify-center space-y-3 md:w-2/5">
            <span className="text-left">
              <div
                className={`inline-block transition-all duration-300 ${tabs[selectedTab].content.svg.bg} ${tabs[selectedTab].content.svg.border} items-center rounded-xl border p-2 align-middle`}
              >
                {tabs[selectedTab].content.svg.code}
              </div>
              <span
                className={`ml-3 transition-colors duration-300 ${tabs[selectedTab].content.label.colour} font-semibold tracking-wide`}
              >
                {tabs[selectedTab].content.label.text}
              </span>
            </span>

            <div className="transition-transform">
              <h2 className="mb-1.5 text-3xl font-semibold transition-transform">
                {tabs[selectedTab].content.header}
              </h2>
              <p className="flex-shrink text-white transition-transform">
                {tabs[selectedTab].content.description}
              </p>
            </div>
          </div>

          <div className="flex min-h-96 w-full items-center justify-center rounded-2xl border border-zinc-800 bg-gradient-to-tr from-zinc-900/10 via-zinc-500/10 to-zinc-900/10 transition-colors hover:border-zinc-700 md:w-2/5">
            {tabs[selectedTab].svg}
          </div>
        </div>
      </div>
    </div>
  )
}
