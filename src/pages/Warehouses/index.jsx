import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/useToast'
import { warehouseService } from '@/services/warehouse.service'
import { SearchInput } from '@/components/ui/SearchInput'
import Button from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import TableSkeleton from '@/components/ui/TableSkeleton'
import WarehouseTableRow from '@/components/warehouses/WarehouseTableRow'
import WarehouseMap from '@/components/warehouses/WarehouseMap'
import { Plus, Trash2 } from 'lucide-react'

const Warehouses = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)
  const [showMap, setShowMap] = useState(true)

  const {
    data: warehousesData,
    isLoading,
  } = useQuery({
    queryKey: ['warehouses'],
    queryFn: warehouseService.getAllWarehouses,
  })

  const warehouses = warehousesData?.data || []
  const filteredWarehouses = warehouses.filter(warehouse => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    const attrs = warehouse.attributes || {}
    return (
      attrs.name?.toLowerCase().includes(searchLower) ||
      attrs.city?.toLowerCase().includes(searchLower) ||
      attrs.county?.toLowerCase().includes(searchLower) ||
      attrs.region?.toLowerCase().includes(searchLower) ||
      attrs.country?.toLowerCase().includes(searchLower) ||
      (attrs.address && JSON.stringify(attrs.address).toLowerCase().includes(searchLower))
    )
  })

  const warehousesWithCoordinates = filteredWarehouses.filter(w => {
    const lat = w.attributes?.latitude
    const lng = w.attributes?.longitude
    
    // Convert to number if string, then validate
    const latNum = typeof lat === 'string' ? parseFloat(lat) : lat
    const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng
    
    return latNum != null && lngNum != null &&
           typeof latNum === 'number' && !isNaN(latNum) && isFinite(latNum) &&
           typeof lngNum === 'number' && !isNaN(lngNum) && isFinite(lngNum)
  })

  const deleteMutation = useMutation({
    mutationFn: warehouseService.deleteWarehouse,
    onSuccess: () => {
      toast.success('Warehouse Deleted', 'Warehouse has been deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      setDeleteModalOpen(false)
      setSelectedWarehouse(null)
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 
                         'Failed to delete warehouse'
      toast.error('Deletion Failed', errorMessage)
    },
  })

  const handleDeleteClick = (warehouse) => {
    setSelectedWarehouse(warehouse)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (selectedWarehouse) {
      deleteMutation.mutate(selectedWarehouse.id)
    }
  }

  const getMapCenter = () => {
    if (warehousesWithCoordinates.length === 0) {
      return { lat: 5.6037, lng: -0.1870 }
    }

    const avgLat = warehousesWithCoordinates.reduce((sum, w) => {
      const lat = w.attributes.latitude
      const latNum = typeof lat === 'string' ? parseFloat(lat) : lat
      return sum + latNum
    }, 0) / warehousesWithCoordinates.length

    const avgLng = warehousesWithCoordinates.reduce((sum, w) => {
      const lng = w.attributes.longitude
      const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng
      return sum + lngNum
    }, 0) / warehousesWithCoordinates.length

    return { lat: avgLat, lng: avgLng }
  }

  return (
    <div className="bg-gray-50 montserrat min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Space Management</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage space locations and inventory storage.</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="w-full sm:w-1/2">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search warehouses by name, city, region, or country..."
            />
          </div>
          <div className="w-full sm:w-1/2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              onClick={() => navigate('/spaces/new')}
              className="flex items-center justify-center gap-2 flex-1"
            >
              <Plus className="w-4 h-4" />
              Create Warehouse
            </Button>
            <Button
              onClick={() => setShowMap(!showMap)}
              className="bg-gray-200 text-gray-700 hover:bg-gray-300 flex-1"
            >
              {showMap ? 'Hide Map' : 'Show Map'}
            </Button>
          </div>
        </div>

        {showMap && warehousesWithCoordinates.length > 0 && (
          <div className="mb-6">
            <WarehouseMap
              warehouses={warehousesWithCoordinates}
              center={getMapCenter()}
              height="500px"
            />
            <p className="text-sm text-gray-600 mt-2 text-center">
              Showing {warehousesWithCoordinates.length} warehouse location{warehousesWithCoordinates.length !== 1 ? 's' : ''} on map
            </p>
          </div>
        )}

        <div className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    County / City
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Region
                  </th>
                 
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Address
                  </th>
                 
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4">
                      <TableSkeleton />
                    </td>
                  </tr>
                ) : filteredWarehouses.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      {search ? 'No warehouses found matching your search' : 'No warehouses found'}
                    </td>
                  </tr>
                ) : (
                  filteredWarehouses.map((warehouse) => (
                    <WarehouseTableRow
                      key={warehouse.id}
                      warehouse={warehouse}
                      onDelete={handleDeleteClick}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <ConfirmModal
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false)
            setSelectedWarehouse(null)
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Warehouse"
          description={
            selectedWarehouse
              ? `Are you sure you want to delete "${selectedWarehouse.attributes?.name}"? This action cannot be undone.`
              : ''
          }
          confirmText="Delete"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      </div>
    </div>
  )
}

export default Warehouses
