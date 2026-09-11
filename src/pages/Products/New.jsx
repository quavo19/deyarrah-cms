import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/hooks/useToast'
import MultiStepForm from '@/components/products/MultiStepForm'
import ProgressModal from '@/components/products/ProgressModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import BackButton from '@/components/ui/BackButton'
import ProductInfoStep from '@/components/products/steps/ProductInfoStep'
import ProductMetaStep from '@/components/products/steps/ProductMetaStep'
import VariantsStep from '@/components/products/steps/VariantsStep'
import VariantStocksStep from '@/components/products/steps/VariantStocksStep'
import ImagesStep from '@/components/products/steps/ImagesStep'
import { productService } from '@/services/product.service'
import { validateStep } from '@/utils/productValidation'

const STORAGE_KEY = 'new_product_draft'
const STORAGE_STEP_KEY = 'new_product_current_step'

const serializeFormData = (data) => {
  const serialized = { ...data }
  
  if (serialized.images && Array.isArray(serialized.images)) {
    serialized.images = serialized.images.map(img => {
      if (img.file) {
        return {
          ...img,
          file: null,
          fileMetadata: {
            name: img.file.name,
            size: img.file.size,
            type: img.file.type,
            lastModified: img.file.lastModified
          },
          hasFile: true
        }
      }
      return { ...img, file: null, hasFile: false }
    })
  }
  
  return serialized
}

const deserializeFormData = (data) => {
  if (!data) return null
  
  const deserialized = { ...data }
  
  if (deserialized.images && Array.isArray(deserialized.images)) {
    deserialized.images = deserialized.images.map(img => {
      const { fileMetadata: _FILE_METADATA, hasFile: _HAS_FILE, ...rest } = img
      return { ...rest, file: null }
    })
  }
  
  return deserialized
}

const NewProduct = () => {
  const toast = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [progressDescription, setProgressDescription] = useState('')
  const [showClearDraftModal, setShowClearDraftModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    bookable_type: '',
    category_id: '',
    category_ids: [],
    sub_category_ids: [],
    active: true,
    delivery_rate_per_km: '',
    bonus_points: '',
    product_meta: [],
    variant_types: [],
    variant_stocks: [],
    images: []
  })
  const [errors, setErrors] = useState({})
  const [isInitialized, setIsInitialized] = useState(false)
  const hasShownDraftToast = useRef(false)

  useEffect(() => {
    // Only run once on mount
    if (hasShownDraftToast.current) return
    
    try {
      const savedStep = localStorage.getItem(STORAGE_STEP_KEY)
      const savedData = localStorage.getItem(STORAGE_KEY)
      
      if (savedData) {
        const parsed = JSON.parse(savedData)
        const deserialized = deserializeFormData(parsed)
        
        if (deserialized) {
          setFormData(deserialized)
          if (savedStep) {
            const step = parseInt(savedStep, 10)
            if (step >= 1 && step <= 5) {
              setCurrentStep(step)
            }
          }
          
          hasShownDraftToast.current = true
          setTimeout(() => {
            toast.info(
              'Draft Restored',
              'Your previous form data has been restored. Note: Image files need to be re-uploaded.'
            )
          }, 500)
        }
      }
    } catch (error) {
      console.error('Error loading draft from localStorage:', error)
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STORAGE_STEP_KEY)
    } finally {
      setIsInitialized(true)
    }
  }, [toast])

  useEffect(() => {
    if (!isInitialized) return
    
    if (formData.name || formData.description || formData.bookable_type || 
        formData.product_meta?.length > 0 || formData.variant_types?.length > 0 ||
        formData.variant_stocks?.length > 0 || formData.images?.length > 0) {
      try {
        const serialized = serializeFormData(formData)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized))
        localStorage.setItem(STORAGE_STEP_KEY, currentStep.toString())
      } catch (error) {
        console.error('Error saving draft to localStorage:', error)
        if (error.name === 'QuotaExceededError') {
          toast.warning('Storage Full', 'Could not save draft. Please clear some data.')
        }
      }
    }
  }, [formData, currentStep, isInitialized, toast])

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_STEP_KEY)
  }

  const steps = [
    { label: 'Product Info', step: 1 },
    { label: 'Metadata', step: 2 },
    { label: 'Variants', step: 3 },
    { label: 'Stock', step: 4 },
    { label: 'Images', step: 5 },
  ]

  const progressSteps = [
    { label: 'Creating Product', description: 'Setting up product information' },
    { label: 'Adding Metadata', description: 'Adding product metadata' },
    { label: 'Creating Variants', description: 'Setting up variant types and options' },
    { label: 'Creating Stock', description: 'Setting up inventory stock' },
    { label: 'Uploading Images', description: 'Uploading images to Cloudinary' },
    { label: 'Complete', description: 'Product created successfully' },
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      
      if (name === 'bookable_type' && value === 'unit') {
        updated.variant_types = []
        updated.variant_stocks = [{ option_names: [], warehouse_stocks: [] }]
      }
      
      return updated
    })

    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev }
        delete updated[name]
        return updated
      })
    }
  }

  const handleStepChange = (step) => {
    const validation = validateStep(currentStep, formData)
    
    if (!validation.isValid) {
      setErrors(validation.errors)
      toast.error('Validation Error', 'Please fix the errors before proceeding')
      return
    }

    setErrors({})
    setCurrentStep(step)
  }

  const handleProgress = (step, description) => {
    setProgressStep(step)
    setProgressDescription(description || '')
    
    if (step > 0 && window.progressModal) {
      if (step > 1) {
        window.progressModal.markComplete(step - 1)
      }
    }
  }

  const handleSubmit = async () => {
    const validation = validateStep(currentStep, formData)
    
    if (!validation.isValid) {
      setErrors(validation.errors)
      toast.error('Validation Error', 'Please fix the errors before submitting')
      return
    }

    let allValid = true
    const allErrors = {}

    for (let step = 1; step <= steps.length; step++) {
      const stepValidation = validateStep(step, formData)
      if (!stepValidation.isValid) {
        allValid = false
        Object.assign(allErrors, stepValidation.errors)
      }
    }

    if (!allValid) {
      setErrors(allErrors)
      toast.error('Validation Error', 'Please fix all errors before submitting')
      return
    }

    setIsSubmitting(true)
    setErrors({})
    setShowProgressModal(true)
    setProgressStep(1)
    setProgressDescription('Starting...')

    try {
      const submitData = {
        ...formData,
        active: formData.active !== false,
      }

      await productService.createProductInventory(submitData, handleProgress)

      if (window.progressModal) {
        for (let i = 1; i <= progressSteps.length; i++) {
          window.progressModal.markComplete(i)
        }
      }

      setProgressStep(progressSteps.length)
      setProgressDescription('Product created successfully!')

      toast.success(
        'Product Created',
        'Your product has been created successfully!'
      )

      // Clear draft and reset form
      clearDraft()
      setFormData({
        name: '',
        description: '',
        bookable_type: '',
        category_id: '',
        category_ids: [],
        sub_category_ids: [],
        active: true,
        delivery_rate_per_km: '',
        bonus_points: '',
        product_meta: [],
        variant_types: [],
        variant_stocks: [],
        images: []
      })
      setCurrentStep(1)
      setErrors({})
      
      setTimeout(() => {
        setShowProgressModal(false)
      }, 2000)
    } catch (error) {
      console.error('Error creating product:', error)
      
      if (window.progressModal) {
        for (let i = 1; i <= progressSteps.length; i++) {
          window.progressModal.markIncomplete(i)
        }
      }

      const errorMessage = error.response?.data?.error || 
                           error.message || 
                           'Failed to create product. Please try again.'
      
      toast.error(
        'Creation Failed',
        errorMessage
      )

      setTimeout(() => {
        setShowProgressModal(false)
      }, 2000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ProductInfoStep
            formData={formData}
            errors={errors}
            onChange={handleInputChange}
          />
        )
      case 2:
        return (
          <ProductMetaStep
            formData={formData}
            errors={errors}
            onChange={handleInputChange}
          />
        )
      case 3:
        return (
          <VariantsStep
            formData={formData}
            errors={errors}
            onChange={handleInputChange}
          />
        )
      case 4:
        return (
          <VariantStocksStep
            formData={formData}
            errors={errors}
            onChange={handleInputChange}
          />
        )
      case 5:
        return (
          <ImagesStep
            formData={formData}
            errors={errors}
            onChange={handleInputChange}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      <div className="bg-gray-50 min-h-screen montserrat py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <BackButton>
                Back
              </BackButton>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Product</h1>
                <p className="text-gray-600 mt-2">
                  Follow the steps below to create a complete product inventory
                </p>
              </div>
              {(formData.name || formData.description || formData.bookable_type) && (
                <button
                  onClick={() => setShowClearDraftModal(true)}
                  className="px-4 py-1 text-sm bg-red-50 cursor-pointer text-red-500 rounded-full transition-colors border border-red-600"
                >
                  Clear Draft
                </button>
              )}
            </div>
          </div>

          <MultiStepForm
            steps={steps}
            currentStep={currentStep}
            onStepChange={handleStepChange}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          >
            {renderStepContent()}
          </MultiStepForm>
        </div>
      </div>

      <ProgressModal
        key={showProgressModal ? 'open' : 'closed'}
        isOpen={showProgressModal}
        steps={progressSteps}
        currentStep={progressStep}
        description={progressDescription}
        onClose={progressStep > progressSteps.length ? () => setShowProgressModal(false) : null}
      />

      <ConfirmModal
        open={showClearDraftModal}
        onClose={() => setShowClearDraftModal(false)}
        onConfirm={() => {
          clearDraft()
          setFormData({
            name: '',
            description: '',
            bookable_type: '',
            category_id: '',
            category_ids: [],
            sub_category_ids: [],
            active: true,
            delivery_rate_per_km: '',
            bonus_points: '',
            product_meta: [],
            variant_types: [],
            variant_stocks: [],
            images: []
          })
          setCurrentStep(1)
          setErrors({})
          setShowClearDraftModal(false)
          toast.info('Form Cleared', 'All form data has been cleared.')
        }}
        title="Clear Draft"
        description="Are you sure you want to clear all form data? This cannot be undone."
        confirmText="Clear Draft"
        variant="danger"
      />
    </>
  )
}

export default NewProduct
