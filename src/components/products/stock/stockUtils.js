export const formatOptionNames = (options) => {
  if (!options || options.length === 0) {
    return 'Unit Product'
  }
  return options.map(opt => {
    if (typeof opt === 'object' && opt.name) {
      return `${opt.variant_type_name || 'Unknown'}: ${opt.name}`
    }
    return opt
  }).join(', ')
}

export const getWarehouseName = (warehouseId, warehouses) => {
  const warehouse = warehouses.find(w => w.id === warehouseId)
  return warehouse?.attributes?.name || warehouseId
}
