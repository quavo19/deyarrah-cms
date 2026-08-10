import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/Sheet'
import Button from '@/components/ui/Button'

const ModalSheet = ({
  open,
  onOpenChange,
  heading,
  description,
  children,
  primaryButton,
  secondaryButton,
  side = "right",
  className = "w-full sm:max-w-md",
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={className}>
        <SheetHeader>
          <SheetTitle>{heading}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="mt-6">{children}</div>
        {(primaryButton || secondaryButton) && (
          <SheetFooter className="mt-6">
            {secondaryButton && (
              <Button
                type="button"
                onClick={secondaryButton.onClick}
                disabled={secondaryButton.disabled}
                isLoading={secondaryButton.isLoading}
                loadingText={secondaryButton.loadingText}
                className="flex-1 sm:flex-initial bg-gray-200! text-gray-700! border-gray-300 hover:bg-gray-50"
              >
                {secondaryButton.text}
              </Button>
            )}
            {primaryButton && (
              <Button
                type="button"
                onClick={primaryButton.onClick}
                disabled={primaryButton.disabled}
                isLoading={primaryButton.isLoading}
                loadingText={primaryButton.loadingText}
                className="flex-1 sm:flex-initial"
              >
                {primaryButton.text}
              </Button>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default ModalSheet
