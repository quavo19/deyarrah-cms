const OptionsDisplay = ({ options }) => {
  if (!options || options.length === 0) {
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
        Unit Product
      </span>
    )
  }

  const groupedOptions = options.reduce((acc, opt) => {
    const variantType = opt.name || 'Unknown'
    if (!acc[variantType]) {
      acc[variantType] = []
    }
    acc[variantType].push(opt.name)
    return acc
  }, {})

  return (
    <div className="flex gap-2 flex-wrap justify-start items-center">
      {Object.entries(groupedOptions).map(([variantType, optionNames]) => (
        <div key={variantType} className="flex gap-1 flex-wrap justify-start items-center">
          <span className="text-xs font-light text-gray-500 capitalize tracking-wider">
            {variantType.toLowerCase()}
          </span>
          <div className="flex flex-wrap gap-2">
            {optionNames.map((name, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-light bg-blue-50 text-primary capitalize"
              >
                {name.toLowerCase()}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default OptionsDisplay
