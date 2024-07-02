'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { arrow, cube } from '@/content/icons'

export default function Solutions() {
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
        label: 'InsightAI',
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
        label: 'StreamFlow',
        svg: cube(),
        content: {
          svg: {
            code: cube('text-purple-500'),
            border: 'border-purple-500',
            bg: 'bg-purple-500/20',
          },
          label: { text: 'StreamFlow', colour: 'text-purple-500' },
          header: 'Unlock the Power of Data Analytics',
          description:
            'Gain deep insights into your business performance with our advanced analytics tools.',
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
      <nav className="relative grid w-full grid-cols-1 gap-2 rounded-2xl border border-zinc-800 bg-night-twilight p-1.5 md:w-4/5 md:grid-cols-4 md:rounded-full">
        {tabs.map((tab, index) => (
          <button
            key={index}
            ref={(el) => {
              if (el) {
                tabRefs.current[index] = el
              }
            }}
            className={`z-10 flex-grow px-4 py-2 text-left transition-all md:py-4 md:text-center ${
              selectedTab === index
                ? 'font-semibold text-white'
                : 'text-gray-400'
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
