import { useState, useEffect } from "react"
import { Search } from "lucide-react"

export const SearchInput = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  debounceMs = 500,
}) => {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        const syntheticEvent = {
          target: { value: localValue },
        }
        onChange(syntheticEvent)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [localValue, debounceMs, onChange, value])

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center justify-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border-0 focus:outline-none font-light"
      />
    </div>
  )
}

