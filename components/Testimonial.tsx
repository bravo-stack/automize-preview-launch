export default function Testimonial() {
  const testimonials = [
    {
      quote: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      by: 'John Doe',
    },
    {
      quote: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem.',
      by: 'Jane Smith',
    },
    {
      quote: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      by: 'John Doe',
    },
    {
      quote: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem.',
      by: 'Jane Smith',
    },
  ]

  return (
    <ul className="grid grid-cols-4 gap-3">
      {testimonials.map((testimonial, index) => (
        <li
          key={index}
          className="bg-zinc-900 p-3 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors"
        >
          <p className="mb-1.5">&quot;{testimonial.quote}&quot;</p>
          <span className="font-semibold">{testimonial.by}</span>
        </li>
      ))}
    </ul>
  )
}
