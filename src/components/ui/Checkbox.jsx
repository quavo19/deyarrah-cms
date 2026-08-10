import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = ({
  checked = false,
  onChange,
  disabled = false,
  className = "",
  ...props
}) => {
  return (
    <label
      className={cn(
        "relative inline-flex items-center cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
        {...props}
      />
      <div
        className={cn(
          "w-4 h-4 border-2 rounded transition-colors flex items-center justify-center",
          checked
            ? "bg-primary border-primary"
            : "bg-white border-gray-300",
          !disabled && "hover:border-primary"
        )}
      >
        {checked && (
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        )}
      </div>
    </label>
  )
}

export default Checkbox
