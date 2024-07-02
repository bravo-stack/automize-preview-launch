'use client'

import { useState, FC } from 'react'

interface FaqProps {
  faqs: {
    question: string
    answer: string
  }[]
}

const Faq: FC<FaqProps> = ({ faqs }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div key={index} className="border-b border-gray-300">
          <button
            className="flex w-full items-center justify-between py-4 text-left transition-colors hover:text-zinc-500"
            onClick={() => toggleFaq(index)}
          >
            <span className="text-lg font-semibold">{faq.question}</span>
            <svg
              className={`h-6 w-6 transform transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>
          <div
            className={`transition-max-height overflow-hidden duration-300 ${openIndex === index ? 'max-h-40' : 'max-h-0'}`}
          >
            <p className="py-4">{faq.answer}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Faq
