/**
 * Validation utilities for product creation form
 */

export const validateProductInfo = (data) => {
  const errors = {}

  if (!data.name || data.name.trim() === '') {
    errors.name = 'Product name is required'
  } else if (data.name.length < 3) {
    errors.name = 'Product name must be at least 3 characters'
  } else if (data.name.length > 255) {
    errors.name = 'Product name must be less than 255 characters'
  }

  if (!data.description || data.description.trim() === '') {
    errors.description = 'Product description is required'
  } else if (data.description.length < 10) {
    errors.description = 'Product description must be at least 10 characters'
  }

  if (!data.bookable_type) {
    errors.bookable_type = 'Product type is required'
  } else if (!['bulk', 'unit'].includes(data.bookable_type)) {
    errors.bookable_type = 'Product type must be either "bulk" or "unit"'
  }

  const categoryIds = data.category_ids || (data.category_id ? [data.category_id] : [])
  if (categoryIds.length === 0) {
    errors.category_ids = 'At least one category is required'
  }

  if (data.bonus_points !== undefined && data.bonus_points !== null && data.bonus_points !== '') {
    const bonusPoints = Number(data.bonus_points)
    if (!Number.isInteger(bonusPoints) || bonusPoints < 0) {
      errors.bonus_points = 'Bonus points must be a whole number 0 or greater'
    }
  }

  if (data.affiliate_commission_amount !== undefined && data.affiliate_commission_amount !== null && data.affiliate_commission_amount !== '') {
    const commission = Number(data.affiliate_commission_amount)
    if (Number.isNaN(commission) || commission < 0) {
      errors.affiliate_commission_amount = 'Affiliate commission must be 0 or greater'
    }
  }

  const shippingType = data.shipping_type || 'bulk'
  if (!['bulk', 'high_value'].includes(shippingType)) {
    errors.shipping_type = 'Shipping type must be bulk or high-value'
  }

  if (shippingType === 'bulk') {
    if (data.weight_kg !== undefined && data.weight_kg !== null && data.weight_kg !== '') {
      const weight = Number(data.weight_kg)
      if (Number.isNaN(weight) || weight < 0) {
        errors.weight_kg = 'Weight must be 0 or greater'
      }
    }

    if (!data.weight_kg && !data.weight_class) {
      errors.weight_class = 'Choose a weight class or enter exact weight'
    }
  }

  if (shippingType === 'high_value' && !String(data.shipping_category || '').trim()) {
    errors.shipping_category = 'Shipping category is required for high-value products'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const validateProductMeta = (productMeta) => {
  const errors = {}

  if (!productMeta || productMeta.length === 0) {
    return { isValid: true, errors: {} } // Optional field
  }

  productMeta.forEach((meta, index) => {
    if (!meta.name || meta.name.trim() === '') {
      errors[`meta_${index}_name`] = 'Meta name is required'
    }

    if (!meta.value || meta.value.trim() === '') {
      errors[`meta_${index}_value`] = 'Meta value is required'
    }
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const validateVariants = (variantTypes, bookableType) => {
  const errors = {}

  if (bookableType === 'bulk') {
    if (!variantTypes || variantTypes.length === 0) {
      errors.variant_types = 'At least one variant type is required for bulk products'
      return { isValid: false, errors }
    }

    variantTypes.forEach((variantType, vIndex) => {
      const isBaseVariant = vIndex === 0 && variantType.name === 'Base'
      
      // Skip name validation for Base variant
      if (!isBaseVariant && (!variantType.name || variantType.name.trim() === '')) {
        errors[`variant_${vIndex}_name`] = 'Variant type name is required'
      }

      if (!variantType.options || variantType.options.length === 0) {
        errors[`variant_${vIndex}_options`] = 'At least one option is required for each variant type'
      } else {
        variantType.options.forEach((option, oIndex) => {
          const isBaseOption = isBaseVariant && oIndex === 0 && option.name === 'Standard'
          
          // Skip name validation for Standard option in Base variant
          if (!isBaseOption && (!option.name || option.name.trim() === '')) {
            errors[`variant_${vIndex}_option_${oIndex}_name`] = 'Option name is required'
          }

          // Price validation - required for Base option, optional for others
          if (option.price !== undefined && option.price !== null) {
            const price = parseFloat(option.price)
            if (isNaN(price) || price < 0) {
              errors[`variant_${vIndex}_option_${oIndex}_price`] = 'Price must be a valid positive number'
            }
          } else if (isBaseOption) {
            // Base option requires a price
            errors[`variant_${vIndex}_option_${oIndex}_price`] = 'Price is required for base pricing option'
          }
        })
      }
    })
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const validateVariantStocks = (variantStocks, bookableType, variantTypes = []) => {
  const errors = {}

  if (!variantStocks || variantStocks.length === 0) {
    errors.variant_stocks = 'At least one stock entry is required'
    return { isValid: false, errors }
  }

  variantStocks.forEach((stock, index) => {
    if (bookableType === 'bulk') {
      if (!stock.option_names || stock.option_names.length === 0) {
        errors[`stock_${index}_options`] = 'Option names are required for bulk products'
      } else if (stock.option_names.length !== variantTypes.length) {
        errors[`stock_${index}_options`] = `Must select exactly ${variantTypes.length} options (one for each variant type)`
      }
    }

    // Validate warehouse_stocks
    if (!stock.warehouse_stocks || stock.warehouse_stocks.length === 0) {
      errors[`stock_${index}_warehouses`] = 'At least one warehouse is required'
    } else {
      stock.warehouse_stocks.forEach((warehouseStock, warehouseIndex) => {
        if (!warehouseStock.warehouse_id || warehouseStock.warehouse_id.trim() === '') {
          errors[`stock_${index}_warehouse_${warehouseIndex}`] = 'Warehouse is required'
        }

        if (warehouseStock.quantity === undefined || warehouseStock.quantity === null || warehouseStock.quantity === '') {
          errors[`stock_${index}_warehouse_${warehouseIndex}_quantity`] = 'Quantity is required'
        } else {
          const quantity = parseInt(warehouseStock.quantity)
          if (isNaN(quantity) || quantity < 0) {
            errors[`stock_${index}_warehouse_${warehouseIndex}_quantity`] = 'Quantity must be a valid non-negative integer'
          }
        }
      })
    }
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const validateImages = (images, variantTypes = []) => {
  const errors = {}

  if (!images || images.length === 0) {
    return { isValid: true, errors: {} } // Optional field
  }

  images.forEach((image, index) => {
    // Image must have either a URL or a file
    if (!image.url && !image.file) {
      errors[`image_${index}_url`] = 'Image URL or file is required'
    }

    // If URL is provided (and no file), validate it
    if (image.url && !image.file) {
      try {
        new URL(image.url)
      } catch {
        errors[`image_${index}_url`] = 'Image URL must be a valid URL'
      }
    }

    // If owner_type is VariantOption, owner_id is required
    if (image.owner_type === 'VariantOption') {
      if (!image.owner_id || image.owner_id.trim() === '') {
        errors[`image_${index}_owner_id`] = 'Variant option is required when attaching to variant option'
      } else {
        // Validate that the owner_id references a valid variant option
        const [variantIndex, optionIndex] = image.owner_id.split('-').map(Number)
        if (
          isNaN(variantIndex) || 
          isNaN(optionIndex) ||
          !variantTypes[variantIndex] ||
          !variantTypes[variantIndex].options?.[optionIndex]
        ) {
          errors[`image_${index}_owner_id`] = 'Invalid variant option selected'
        }
      }
    }
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const validateStep = (step, formData) => {
  switch (step) {
    case 1:
      return validateProductInfo(formData)
    case 2:
      return validateProductMeta(formData.product_meta || [])
    case 3:
      return validateVariants(formData.variant_types || [], formData.bookable_type)
    case 4:
      return validateVariantStocks(
        formData.variant_stocks || [],
        formData.bookable_type,
        formData.variant_types || []
      )
    case 5:
      return validateImages(formData.images || [], formData.variant_types || [])
    default:
      return { isValid: true, errors: {} }
  }
}
