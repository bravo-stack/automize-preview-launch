const Cycle = () => {
  const items = ['Business', 'Performance', 'Costs', 'Success', 'Business']

  return (
    <span className="items-center font-semibold">
      <div className="flex h-[50px]">
        <span className="font-bo mr-3 text-5xl">Your</span>
        <div className="overflow-hidden bg-gradient-to-b bg-clip-text tracking-wide text-transparent">
          {items.map((text, index) => (
            <span
              key={index}
              className="block animate-cycle bg-gradient-to-b bg-clip-text py-1.5 text-5xl tracking-wide text-transparent"
            >
              {text}
            </span>
          ))}
        </div>
      </div>
    </span>
  )
}

export default Cycle
