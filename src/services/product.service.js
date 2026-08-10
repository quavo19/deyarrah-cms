import { api } from '@/api/client'
import { ENDPOINTS } from '@/constants/endpoints'
import { uploadToCloudinary } from '@/utils/cloudinary'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const productService = {
  createProductInventory: async (productData, onProgress) => {
    const createdIds = {
      productId: null,
      productMetaIds: [],
      variantTypeIds: {},
      optionIds: {},
      variantStockIds: [],
      imageIds: [],
      imageMetadata: []
    }

    const progress = (step, description) => {
      if (onProgress) {
        onProgress(step, description)
      }
    }
    
    const completeStep = async (step, description) => {
      progress(step, description || 'Completed')
      await delay(300)
      if (step < 6) {
        progress(step + 1, '')
        await delay(50)
      }
    }

    try {
      progress(1, 'Creating product...')
      
      const productResponse = await api.post(ENDPOINTS.PRODUCTS.CREATE, {
        product: {
          name: productData.name,
          description: productData.description,
          bookable_type: productData.bookable_type,
          active: productData.active ?? true,
          category_id: productData.category_id,
          delivery_rate_per_km: productData.delivery_rate_per_km || null
        }
      })

      if (!productResponse.data?.data?.id) {
        const errorMsg = productResponse.data?.error || 
                        productResponse.data?.message || 
                        'Product creation failed'
        throw new Error(errorMsg)
      }

      const productResult = productResponse.data
      createdIds.productId = productResult.data.id
      await completeStep(1, 'Product created successfully')

      if (productData.product_meta && productData.product_meta.length > 0) {
        progress(2, 'Adding product metadata...')
        
        for (let i = 0; i < productData.product_meta.length; i++) {
          const meta = productData.product_meta[i]
          const metaResponse = await api.post(
            ENDPOINTS.PRODUCTS.PRODUCT_META.CREATE(createdIds.productId),
            { product_meta: meta }
          )

          if (!metaResponse.data?.data?.id) {
            const errorMsg = metaResponse.data?.error || 
                            metaResponse.data?.message || 
                            'Product meta creation failed'
            throw new Error(errorMsg)
          }

          const metaResult = metaResponse.data
          createdIds.productMetaIds.push(metaResult.data.id)
          progress(2, `Added metadata ${i + 1} of ${productData.product_meta.length}`)
        }
        await completeStep(2, 'Product metadata added successfully')
      } else {
        progress(2, 'Skipping metadata (none provided)')
        await delay(200)
        progress(3, '')
        await delay(50)
      }

      if (productData.bookable_type === 'bulk' && productData.variant_types) {
        progress(3, 'Creating variant types and options...')
        
        const totalVariants = productData.variant_types.length
        for (let vIndex = 0; vIndex < totalVariants; vIndex++) {
          const variantType = productData.variant_types[vIndex]
          const isBaseVariant = vIndex === 0 && variantType.name === 'Base'
          progress(3, `Creating variant type "${variantType.name}" (${vIndex + 1}/${totalVariants})...`)
          
          const variantTypeResponse = await api.post(
            ENDPOINTS.PRODUCTS.VARIANTS.CREATE(createdIds.productId),
            {
              variant_type: {
                name: variantType.name,
                description: variantType.description,
                ...(isBaseVariant && { pricing_role: 'base' })
              }
            }
          )

          if (!variantTypeResponse.data?.data?.id) {
            const errorMsg = variantTypeResponse.data?.error || 
                            variantTypeResponse.data?.message || 
                            'Variant type creation failed'
            throw new Error(errorMsg)
          }

          const variantTypeResult = variantTypeResponse.data
          const variantTypeId = variantTypeResult.data.id
          createdIds.variantTypeIds[variantType.name] = variantTypeId
          createdIds.optionIds[variantType.name] = {}

          if (variantType.options && variantType.options.length > 0) {
            const totalOptions = variantType.options.length
            for (let oIndex = 0; oIndex < totalOptions; oIndex++) {
              const option = variantType.options[oIndex]
              progress(3, `Creating option "${option.name}" (${oIndex + 1}/${totalOptions}) for "${variantType.name}"...`)
              
              const optionResponse = await api.post(
                ENDPOINTS.PRODUCTS.VARIANTS.OPTIONS.CREATE(variantTypeId),
                {
                  variant_option: {
                    name: option.name,
                    description: option.description,
                    price: option.price?.toString() || "0.00"
                  }
                }
              )

              if (!optionResponse.data?.data?.id) {
                const errorMsg = optionResponse.data?.error || 
                                optionResponse.data?.message || 
                                'Variant option creation failed'
                throw new Error(errorMsg)
              }

              const optionResult = optionResponse.data
              createdIds.optionIds[variantType.name][option.name] = optionResult.data.id
            }
          }
        }
        await completeStep(3, 'Variant types and options created successfully')
      } else if (productData.bookable_type === 'unit') {
        progress(3, 'Creating base variant type and standard option...')
        
        const unitVariantType = productData.variant_types?.[0] || {
          name: 'Base',
          description: 'Base pricing for unit product',
          options: [{ name: 'Standard', description: 'Standard pricing option', price: '0' }]
        }
        
        progress(3, 'Creating variant type "Base"...')
        const variantTypeResponse = await api.post(
          ENDPOINTS.PRODUCTS.VARIANTS.CREATE(createdIds.productId),
          {
            variant_type: {
              name: unitVariantType.name || 'Base',
              description: unitVariantType.description || 'Base pricing for unit product',
              pricing_role: 'base'
            }
          }
        )

        if (!variantTypeResponse.data?.data?.id) {
          const errorMsg = variantTypeResponse.data?.error || 
                          variantTypeResponse.data?.message || 
                          'Variant type creation failed'
          throw new Error(errorMsg)
        }

        const variantTypeResult = variantTypeResponse.data
        const variantTypeId = variantTypeResult.data.id
        createdIds.variantTypeIds['Base'] = variantTypeId
        createdIds.optionIds['Base'] = {}

        const unitOption = unitVariantType.options?.[0] || { name: 'Standard', description: 'Standard pricing option', price: '0' }
        progress(3, 'Creating option "Standard"...')
        
        const optionResponse = await api.post(
          ENDPOINTS.PRODUCTS.VARIANTS.OPTIONS.CREATE(variantTypeId),
          {
            variant_option: {
              name: unitOption.name || 'Standard',
              description: unitOption.description || 'Standard pricing option',
              price: unitOption.price?.toString() || "0.00"
            }
          }
        )

        if (!optionResponse.data?.data?.id) {
          const errorMsg = optionResponse.data?.error || 
                          optionResponse.data?.message || 
                          'Variant option creation failed'
          throw new Error(errorMsg)
        }

        const optionResult = optionResponse.data
        createdIds.optionIds['Base']['Standard'] = optionResult.data.id
        
        await completeStep(3, 'Base variant type and standard option created successfully')
      } else {
        progress(3, 'Skipping variants (not applicable)')
        await delay(200)
        progress(4, '')
        await delay(50)
      }

      if (productData.variant_stocks && productData.variant_stocks.length > 0) {
        progress(4, 'Creating inventory stock...')
        
        let totalWarehouseStocks = 0
        productData.variant_stocks.forEach(stock => {
          totalWarehouseStocks += stock.warehouse_stocks?.length || 0
        })
        
        let warehouseStockIndex = 0
        
        for (const stock of productData.variant_stocks) {
          let optionIds = []

          if (productData.bookable_type === 'bulk') {
            const variantTypeNames = Object.keys(createdIds.variantTypeIds)
            
            if (stock.option_names.length !== variantTypeNames.length) {
              throw new Error(
                `Variant stock must have exactly ${variantTypeNames.length} option names, got ${stock.option_names.length}`
              )
            }

            optionIds = variantTypeNames.map((variantTypeName, index) => {
              const optionName = stock.option_names[index]
              const optionId = createdIds.optionIds[variantTypeName]?.[optionName]
              
              if (!optionId) {
                throw new Error(
                  `Option "${optionName}" not found for variant type "${variantTypeName}"`
                )
              }
              
              return optionId
            })
          } else if (productData.bookable_type === 'unit') {
            const standardOptionId = createdIds.optionIds['Base']?.['Standard']
            if (!standardOptionId) {
              throw new Error('Standard option not found for unit product')
            }
            optionIds = [standardOptionId]
          } else {
            optionIds = []
          }

          if (!stock.warehouse_stocks || stock.warehouse_stocks.length === 0) {
            throw new Error(
              `Variant stock must have at least one warehouse entry`
            )
          }

          for (const warehouseStock of stock.warehouse_stocks) {
            warehouseStockIndex++
            if (!warehouseStock.warehouse_id) {
              throw new Error('Warehouse ID is required for variant stock')
            }

            if (warehouseStock.quantity === undefined || warehouseStock.quantity === null || warehouseStock.quantity === '') {
              throw new Error('Quantity is required for variant stock')
            }

            const quantity = parseInt(warehouseStock.quantity)
            if (isNaN(quantity) || quantity < 0) {
              throw new Error('Quantity must be a valid non-negative integer')
            }

            progress(4, `Creating stock entry ${warehouseStockIndex}/${totalWarehouseStocks}...`)

            const stockResponse = await api.post(
              `${ENDPOINTS.INVENTORY.VARIANT_STOCKS.CREATE}?product_id=${createdIds.productId}`,
              {
                variant_stock: {
                  warehouse_id: warehouseStock.warehouse_id,
                  option_ids: optionIds,
                  quantity: quantity
                }
              }
            )

            if (!stockResponse.data?.data?.id) {
              const errorMsg = stockResponse.data?.error || 
                              stockResponse.data?.message || 
                              'Variant stock creation failed'
              throw new Error(errorMsg)
            }

            const stockResult = stockResponse.data
            createdIds.variantStockIds.push(stockResult.data.id)
          }
        }
        await completeStep(4, 'Inventory stock created successfully')
      } else {
        progress(4, 'Skipping stock (none provided)')
        await delay(200)
        progress(5, '')
        await delay(50)
      }

      if (productData.images && productData.images.length > 0) {
        progress(5, 'Processing images...')
        
        const uploadedImages = []
        const totalImages = productData.images.length
        
        for (let i = 0; i < totalImages; i++) {
          const image = productData.images[i]
          let imageUrl = image.url

          if (image.file) {
            try {
              progress(5, `Uploading image ${i + 1} of ${totalImages} to Cloudinary...`)
              imageUrl = await uploadToCloudinary(image.file)
            } catch (error) {
              throw new Error(`Failed to upload image ${i + 1}: ${error.message}`)
            }
          }

          if (!imageUrl) {
            throw new Error(`Image ${i + 1} must have either a URL or file`)
          }

          let ownerId = createdIds.productId
          let variantTypeName = null
          let variantId = null
          
          if (image.owner_type === 'VariantOption' && image.owner_id) {
            const [variantIndex, optionIndex] = image.owner_id.split('-').map(Number)
            if (productData.variant_types && productData.variant_types[variantIndex]) {
              const variantType = productData.variant_types[variantIndex]
              const option = variantType.options?.[optionIndex]
              if (option && option.name) {
                variantTypeName = variantType.name
                variantId = createdIds.variantTypeIds[variantTypeName]
                ownerId = createdIds.optionIds[variantTypeName]?.[option.name]
                if (!ownerId) {
                  throw new Error(`Variant option not found for image ${i + 1}`)
                }
                if (!variantId) {
                  throw new Error(`Variant type not found for image ${i + 1}`)
                }
              }
            }
          }

          uploadedImages.push({
            owner_type: image.owner_type || 'Product',
            owner_id: ownerId,
            variant_id: variantId,
            url: imageUrl
          })
        }

        progress(5, 'Creating image records...')
        
        for (let i = 0; i < uploadedImages.length; i++) {
          const imageData = uploadedImages[i]
          progress(5, `Creating image record ${i + 1} of ${uploadedImages.length}...`)
          
          let imageResponse
          
          if (imageData.owner_type === 'VariantOption' && imageData.variant_id) {
            imageResponse = await api.post(
              ENDPOINTS.PRODUCTS.VARIANTS.OPTIONS.IMAGES.CREATE(imageData.variant_id, imageData.owner_id),
              {
                image: {
                  url: imageData.url
                }
              }
            )
          } else {
            imageResponse = await api.post(
              ENDPOINTS.PRODUCTS.IMAGES.CREATE(createdIds.productId),
              {
                image: {
                  owner_type: imageData.owner_type,
                  owner_id: imageData.owner_id,
                  url: imageData.url
                }
              }
            )
          }

          if (!imageResponse.data?.data?.id) {
            const errorMsg = imageResponse.data?.error || 
                            imageResponse.data?.message || 
                            'Image creation failed'
            throw new Error(errorMsg)
          }

          const imageResult = imageResponse.data
          const imageId = imageResult.data.id
          createdIds.imageIds.push(imageId)
          
          createdIds.imageMetadata.push({
            id: imageId,
            owner_type: imageData.owner_type,
            variant_id: imageData.variant_id,
            option_id: imageData.owner_type === 'VariantOption' ? imageData.owner_id : null
          })
        }
        await completeStep(5, 'Images processed successfully')
      } else {
        progress(5, 'Skipping images (none provided)')
        await delay(200)
        progress(6, '')
        await delay(50)
      }

      progress(6, 'Product created successfully!')
      await delay(800)
      return {
        success: true,
        productId: createdIds.productId,
        createdIds: createdIds
      }

    } catch (error) {
      console.error('Error creating product inventory, rolling back...', error)
      
      if (onProgress) {
        onProgress(0, 'Rolling back changes...')
      }
      
      await productService.rollbackCreatedRecords(createdIds, onProgress)
      
      throw error
    }
  },

  rollbackCreatedRecords: async (createdIds, onProgress) => {
    const progress = (description) => {
      if (onProgress) {
        onProgress(0, description)
      }
    }

    if (createdIds.imageIds.length > 0) {
      progress('Deleting images...')
      for (const imageMeta of createdIds.imageMetadata.reverse()) {
        try {
          if (imageMeta.owner_type === 'VariantOption' && imageMeta.variant_id && imageMeta.option_id) {
            await api.delete(
              ENDPOINTS.PRODUCTS.VARIANTS.OPTIONS.IMAGES.DELETE(imageMeta.variant_id, imageMeta.option_id, imageMeta.id)
            )
          } else {
            await api.delete(
              ENDPOINTS.PRODUCTS.IMAGES.DELETE(createdIds.productId, imageMeta.id)
            )
          }
        } catch (e) {
          console.error(`Failed to delete image ${imageMeta.id}:`, e)
        }
      }
    }

    if (createdIds.variantStockIds.length > 0) {
      progress('Deleting inventory stock...')
      for (const stockId of createdIds.variantStockIds.reverse()) {
        try {
          await api.delete(
            `${ENDPOINTS.INVENTORY.VARIANT_STOCKS.DELETE(stockId)}?product_id=${createdIds.productId}`
          )
        } catch (e) {
          console.error(`Failed to delete variant stock ${stockId}:`, e)
        }
      }
    }

    const hasOptions = Object.values(createdIds.optionIds).some(opts => Object.keys(opts).length > 0)
    if (hasOptions) {
      progress('Deleting variant options...')
      for (const [variantTypeName, options] of Object.entries(createdIds.optionIds)) {
        for (const [_OPTION_NAME, optionId] of Object.entries(options)) {
          try {
            const variantTypeId = createdIds.variantTypeIds[variantTypeName]
            await api.delete(ENDPOINTS.PRODUCTS.VARIANTS.OPTIONS.DELETE(variantTypeId, optionId))
          } catch (e) {
            console.error(`Failed to delete option ${optionId}:`, e)
          }
        }
      }
    }

    if (Object.keys(createdIds.variantTypeIds).length > 0) {
      progress('Deleting variant types...')
      for (const variantTypeId of Object.values(createdIds.variantTypeIds).reverse()) {
        try {
          await api.delete(ENDPOINTS.PRODUCTS.VARIANTS.DELETE(variantTypeId))
        } catch (e) {
          console.error(`Failed to delete variant type ${variantTypeId}:`, e)
        }
      }
    }

    if (createdIds.productMetaIds.length > 0) {
      progress('Deleting product metadata...')
      for (const metaId of createdIds.productMetaIds.reverse()) {
        try {
          await api.delete(ENDPOINTS.PRODUCTS.PRODUCT_META.DELETE(createdIds.productId, metaId))
        } catch (e) {
          console.error(`Failed to delete product meta ${metaId}:`, e)
        }
      }
    }

    if (createdIds.productId) {
      progress('Deleting product...')
      try {
        await api.delete(ENDPOINTS.PRODUCTS.DELETE(createdIds.productId))
      } catch (e) {
        console.error(`Failed to delete product ${createdIds.productId}:`, e)
      }
    }
  },

  getAllProducts: async (params = {}) => {
    const response = await api.get(ENDPOINTS.PRODUCTS.LIST, { params })
    return response.data
  },

  getProductById: async (id) => {
    const response = await api.get(ENDPOINTS.PRODUCTS.DETAIL(id))
    return response.data
  },

  updateProduct: async (id, productData) => {
    const response = await api.put(ENDPOINTS.PRODUCTS.UPDATE(id), {
      product: productData
    })
    return response.data
  },

  deleteProduct: async (id) => {
    const response = await api.delete(ENDPOINTS.PRODUCTS.DELETE(id))
    return response.data
  },

  getProductVariants: async (productId) => {
    const response = await api.get(ENDPOINTS.PRODUCTS.VARIANTS.LIST(productId))
    return response.data
  },

  getVariantById: async (variantId) => {
    const response = await api.get(ENDPOINTS.PRODUCTS.VARIANTS.DETAIL(variantId))
    return response.data
  },

  createVariant: async (productId, variantData) => {
    const response = await api.post(ENDPOINTS.PRODUCTS.VARIANTS.CREATE(productId), {
      variant_type: variantData
    })
    return response.data
  },

  updateVariant: async (variantId, variantData) => {
    const response = await api.put(ENDPOINTS.PRODUCTS.VARIANTS.UPDATE(variantId), {
      variant_type: variantData
    })
    return response.data
  },

  deleteVariant: async (variantId) => {
    const response = await api.delete(ENDPOINTS.PRODUCTS.VARIANTS.DELETE(variantId))
    return response.data
  },

  getVariantOptions: async (variantId) => {
    const response = await api.get(ENDPOINTS.PRODUCTS.VARIANTS.OPTIONS.LIST(variantId))
    return response.data
  },

  createVariantOption: async (variantId, optionData) => {
    const response = await api.post(ENDPOINTS.PRODUCTS.VARIANTS.OPTIONS.CREATE(variantId), {
      variant_option: optionData
    })
    return response.data
  },

  updateVariantOption: async (variantId, optionId, optionData) => {
    const response = await api.patch(ENDPOINTS.PRODUCTS.VARIANTS.OPTIONS.UPDATE(variantId, optionId), {
      variant_option: optionData
    })
    return response.data
  },

  deleteVariantOption: async (variantId, optionId) => {
    const response = await api.delete(ENDPOINTS.PRODUCTS.VARIANTS.OPTIONS.DELETE(variantId, optionId))
    return response.data
  },

  getProductMeta: async (productId) => {
    const response = await api.get(ENDPOINTS.PRODUCTS.PRODUCT_META.LIST(productId))
    return response.data
  },

  createProductMeta: async (productId, metaData) => {
    const response = await api.post(ENDPOINTS.PRODUCTS.PRODUCT_META.CREATE(productId), {
      product_meta: metaData
    })
    return response.data
  },

  updateProductMeta: async (productId, metaId, metaData) => {
    const response = await api.put(ENDPOINTS.PRODUCTS.PRODUCT_META.UPDATE(productId, metaId), {
      product_meta: metaData
    })
    return response.data
  },

  deleteProductMeta: async (productId, metaId) => {
    const response = await api.delete(ENDPOINTS.PRODUCTS.PRODUCT_META.DELETE(productId, metaId))
    return response.data
  },

  getProductImages: async (productId) => {
    const response = await api.get(ENDPOINTS.PRODUCTS.IMAGES.LIST, {
      params: {
        owner_type: 'Product',
        owner_id: productId
      }
    })
    return response.data
  },

  createProductImage: async (productId, imageUrl) => {
    const response = await api.post(ENDPOINTS.PRODUCTS.IMAGES.CREATE(productId), {
      image: {
        url: imageUrl
      }
    })
    return response.data
  },

  updateProductImage: async (imageId, imageData) => {
    const response = await api.put(ENDPOINTS.PRODUCTS.IMAGES.UPDATE(imageId), {
      image: imageData
    })
    return response.data
  },

  deleteProductImage: async (productId, imageId) => {
    const response = await api.delete(ENDPOINTS.PRODUCTS.IMAGES.DELETE(productId, imageId))
    return response.data
  },

  createVariantOptionImage: async (variantId, optionId, imageUrl) => {
    const response = await api.post(ENDPOINTS.PRODUCTS.VARIANTS.OPTIONS.IMAGES.CREATE(variantId, optionId), {
      image: {
        url: imageUrl
      }
    })
    return response.data
  },

  deleteVariantOptionImage: async (variantId, optionId, imageId) => {
    const response = await api.delete(ENDPOINTS.PRODUCTS.VARIANTS.OPTIONS.IMAGES.DELETE(variantId, optionId, imageId))
    return response.data
  },

  getVariantStocks: async (params = {}) => {
    const response = await api.get(ENDPOINTS.INVENTORY.VARIANT_STOCKS.LIST, { params })
    return response.data
  },

  getVariantStockById: async (stockId, productId) => {
    const url = productId 
      ? `${ENDPOINTS.INVENTORY.VARIANT_STOCKS.DETAIL(stockId)}?product_id=${productId}`
      : ENDPOINTS.INVENTORY.VARIANT_STOCKS.DETAIL(stockId)
    const response = await api.get(url)
    return response.data
  },

  createVariantStock: async (stockData, productId) => {
    const url = productId 
      ? `${ENDPOINTS.INVENTORY.VARIANT_STOCKS.CREATE}?product_id=${productId}`
      : ENDPOINTS.INVENTORY.VARIANT_STOCKS.CREATE
    const response = await api.post(url, {
      variant_stock: stockData
    })
    return response.data
  },

  updateVariantStock: async (stockId, stockData, productId) => {
    const url = productId 
      ? `${ENDPOINTS.INVENTORY.VARIANT_STOCKS.UPDATE(stockId)}?product_id=${productId}`
      : ENDPOINTS.INVENTORY.VARIANT_STOCKS.UPDATE(stockId)
    const response = await api.put(url, {
      variant_stock: stockData
    })
    return response.data
  },

  deleteVariantStock: async (stockId, productId) => {
    const url = productId 
      ? `${ENDPOINTS.INVENTORY.VARIANT_STOCKS.DELETE(stockId)}?product_id=${productId}`
      : ENDPOINTS.INVENTORY.VARIANT_STOCKS.DELETE(stockId)
    const response = await api.delete(url)
    return response.data
  },
}
