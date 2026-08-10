import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const MultiStepForm = ({ steps, currentStep, onStepChange, children, onSubmit, isSubmitting }) => {
  const canGoNext = currentStep < steps.length
  const canGoPrev = currentStep > 1

  const handleNext = () => {
    if (canGoNext) {
      onStepChange(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (canGoPrev) {
      onStepChange(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    if (currentStep === steps.length) {
      onSubmit()
    } else {
      handleNext()
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const stepNumber = index + 1
            const isActive = stepNumber === currentStep
            const isCompleted = stepNumber < currentStep
            const isLast = stepNumber === steps.length

            return (
              <div key={stepNumber} className="flex items-center justify-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className="relative">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200',
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-primary text-white ring-4 ring-primary/20'
                          : 'bg-gray-200 text-gray-600'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        stepNumber
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <p
                      className={cn(
                        'text-xs font-medium',
                        isActive || isCompleted
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      )}
                    >
                      {step.label}
                    </p>
                  </div>
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2 mb-4 transition-all duration-200',
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl border-gray-200 p-6 mb-6">
        {children}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          onClick={handlePrev}
          disabled={!canGoPrev || isSubmitting}
          className="w-auto px-6 bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <div className="text-sm text-gray-500">
          Step {currentStep} of {steps.length}
        </div>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          isLoading={isSubmitting && currentStep === steps.length}
          loadingText="Creating Product..."
          className="w-auto px-6"
        >
          {currentStep === steps.length ? (
            'Create Product'
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default MultiStepForm
