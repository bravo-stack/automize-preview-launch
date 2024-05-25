const Cycle = () => {
  const items = [
    'Your Business',
    'Your Performance',
    'Your Costs',
    'Your Success',
    'Your Business',
  ]

  return (
    <span className="items-center text-White">
      <div className="flex h-[60px]">
        <div className="overflow-hidden">
          {items.map((text, index) => (
            <span key={index} className="animate-cycle block py-1.5">
              {text}
            </span>
          ))}
        </div>
      </div>
    </span>
  )
}

export default Cycle
