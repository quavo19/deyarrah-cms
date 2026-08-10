import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const CenterModal = ({
  open,
  onClose,
  heading,
  description,
  children,
  className = "",
}) => {
  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/80 animate-in fade-in-0"
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-lg shadow-lg p-6 animate-in fade-in-0 zoom-in-95",
          className
        )}
      >
        <div className="flex items-start justify-between mb-4">
          {heading && <h3 className="text-lg font-semibold text-gray-900">{heading}</h3>}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {description && <p className="text-sm text-gray-600 mb-6">{description}</p>}
        <div>{children}</div>
      </div>
    </>
  )
}

export default CenterModal
