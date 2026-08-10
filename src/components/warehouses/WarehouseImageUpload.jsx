import { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { Image as ImageIcon, Upload, X, Check } from 'lucide-react'
import Button from '@/components/ui/Button'
import { uploadToCloudinary } from '@/utils/cloudinary'

const WarehouseImageUpload = forwardRef(({ 
  imageUrl, 
  onImageUploaded,
  onImageRemoved,
  disabled = false,
  autoUpload = false
}, ref) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState(imageUrl || null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB')
      return
    }

      setError(null)
      setSelectedFile(file)
      
      // Create preview
      const preview = URL.createObjectURL(file)
      setPreviewUrl(preview)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)

    try {
      const url = await uploadToCloudinary(selectedFile)
      setUploadedUrl(url)
      setSelectedFile(null)
      
      // Clean up preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }

      if (onImageUploaded) {
        onImageUploaded(url)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadedUrl(null)
    setError(null)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    if (onImageRemoved) {
      onImageRemoved()
    }
  }

  const displayUrl = uploadedUrl || previewUrl

  // Expose upload function and file to parent via ref
  useImperativeHandle(ref, () => ({
    upload: handleUpload,
    getFile: () => selectedFile,
    hasFile: () => !!selectedFile,
    isUploading: () => isUploading
  }))

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Warehouse Image
      </label>

      {/* File Input */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
          className="hidden"
          id="warehouse-image-input"
        />
        <label
          htmlFor="warehouse-image-input"
          className={`
            flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors
            ${disabled || isUploading
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
            }
          `}
        >
          <ImageIcon className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {selectedFile ? selectedFile.name : 'Choose Image File'}
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          Select an image file (max 10MB). {autoUpload ? 'Image will be uploaded automatically when you submit the form.' : 'Click "Upload" to process with Cloudinary.'}
        </p>
      </div>

      {/* Upload Button (only show when file is selected and not yet uploaded, and not in auto-upload mode) */}
      {selectedFile && !uploadedUrl && !autoUpload && (
        <Button
          type="button"
          onClick={handleUpload}
          disabled={disabled || isUploading}
          isLoading={isUploading}
          loadingText="Uploading..."
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload to Cloudinary
        </Button>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Preview */}
      {displayUrl && (
        <div className="relative">
          <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            <img
              src={displayUrl}
              alt="Warehouse preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
            {uploadedUrl && (
              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                <Check className="w-3 h-3" />
                Uploaded
              </div>
            )}
          </div>
          
          {/* Remove Button */}
          <Button
            type="button"
            onClick={handleRemove}
            disabled={disabled || isUploading}
            className="bg-red-600! mt-4 "
          >
            <X className="w-4 h-4 mr-2" />
            Remove Image
          </Button>
        </div>
      )}

      {/* Info */}
      {!displayUrl && !autoUpload && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Images are only uploaded to Cloudinary when you click the "Upload" button. 
            You can select a file, review it, and then upload when ready.
          </p>
        </div>
      )}
    </div>
  )
})

WarehouseImageUpload.displayName = 'WarehouseImageUpload'

export default WarehouseImageUpload
