import { useEffect, useState, useRef } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const ProgressModal = ({ isOpen, steps, currentStep, description, onClose }) => {
  const [completedSteps, setCompletedSteps] = useState(() => new Set())
  const [displayedStep, setDisplayedStep] = useState(1)
  const delayTimeoutRef = useRef(null)
  const prevIsOpenRef = useRef(isOpen)

  const markStepComplete = (step) => {
    setCompletedSteps(prev => new Set([...prev, step]))
  }

  const markStepIncomplete = (step) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev)
      newSet.delete(step)
      return newSet
    })
  }

  useEffect(() => {
    const wasOpen = prevIsOpenRef.current
    prevIsOpenRef.current = isOpen

    if (wasOpen && !isOpen) {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current)
        delayTimeoutRef.current = null
      }
      setTimeout(() => {
        setDisplayedStep(1)
      }, 0)
    } else if (!wasOpen && isOpen) {
      setTimeout(() => {
        setDisplayedStep(1)
      }, 0)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    if (currentStep > displayedStep) {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current)
      }
      
      delayTimeoutRef.current = setTimeout(() => {
        setDisplayedStep(prev => Math.min(prev + 1, currentStep))
      }, 2000)
    } else if (currentStep < displayedStep) {
      setTimeout(() => {
        setDisplayedStep(currentStep)
      }, 0)
    }

    return () => {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current)
      }
    }
  }, [currentStep, displayedStep, isOpen])

  useEffect(() => {
    if (isOpen) {
      window.progressModal = {
        markComplete: markStepComplete,
        markIncomplete: markStepIncomplete,
        close: onClose
      }
    }
    return () => {
      delete window.progressModal
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Creating Product</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {steps.map((step, index) => {
            const stepNumber = index + 1
            const isCompleted = completedSteps.has(stepNumber)
            const isCurrent = displayedStep === stepNumber && !isCompleted
            const isPending = displayedStep < stepNumber

            return (
              <div
                key={stepNumber}
                className={cn(
                  'flex items-center gap-3 p-3',
                )}
              >
                <div className="shrink-0">
                  {isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-xs text-gray-600 font-medium">{stepNumber}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCompleted && 'text-green-700',
                      isCurrent && 'text-blue-700',
                      isPending && 'text-gray-500'
                    )}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (description || step.description) && (
                    <p className="text-xs text-blue-600 mt-1">{description || step.description}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {displayedStep > steps.length && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-pulse">
            <div className="flex items-center gap-3">
              <div className="shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm text-green-800 font-medium">
                Product created successfully!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProgressModal
