import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const SheetContext = React.createContext({
  open: false,
  setOpen: () => {},
})

const Sheet = ({ children, open, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return (
    <SheetContext.Provider value={{ open: isOpen, setOpen: setIsOpen }}>
      {children}
    </SheetContext.Provider>
  )
}

const SheetTrigger = React.forwardRef(({ className, children, asChild, ...props }, ref) => {
  const { setOpen } = React.useContext(SheetContext)
  
  const handleClick = () => {
    setOpen(true)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: handleClick,
    })
  }

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </div>
  )
})
SheetTrigger.displayName = "SheetTrigger"

const SheetContent = React.forwardRef(
  ({ side = "left", className, children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(SheetContext)
    const [shouldRender, setShouldRender] = React.useState(open)
    const [isClosing, setIsClosing] = React.useState(false)

    React.useEffect(() => {
      if (open) {
        setShouldRender(true)
        setIsClosing(false)
        return undefined
      }

      if (!shouldRender) return undefined

      setIsClosing(true)
      const timeout = window.setTimeout(() => {
        setShouldRender(false)
        setIsClosing(false)
      }, 200)

      return () => window.clearTimeout(timeout)
    }, [open, shouldRender])

    if (!shouldRender) return null

    return (
      <>
        <div
          className={cn(
            "fixed inset-0 z-50 bg-black/80",
            isClosing ? "animate-out fade-out-0" : "animate-in fade-in-0"
          )}
          onClick={() => setOpen(false)}
        />
        <div
          ref={ref}
          className={cn(
            "fixed z-50 gap-4 bg-white p-6 shadow-lg transition ease-in-out",
            side === "left" &&
              `inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm ${
                isClosing ? "animate-out slide-out-to-left" : "animate-in slide-in-from-left"
              }`,
            side === "right" &&
              `inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm ${
                isClosing ? "animate-out slide-out-to-right" : "animate-in slide-in-from-right"
              }`,
            className
          )}
          {...props}
        >
          {children}
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 cursor-pointer rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </>
    )
  }
)
SheetContent.displayName = "SheetContent"

const SheetHeader = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({ className, ...props }) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = "SheetDescription"

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
