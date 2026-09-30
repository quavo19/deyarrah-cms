import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { inventoryService } from '@/services/inventory.service'
import { SearchInput } from '@/components/ui/SearchInput'
import { SlideToggle } from '@/components/ui/SlideToggle'
import Badge from '@/components/ui/Badge'
import TableSkeleton from '@/components/ui/TableSkeleton'
import Button from '@/components/ui/Button'
import { RefreshCw } from 'lucide-react'

const Downtimes = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const {
    data: downtimesData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['downtimes'],
    queryFn: () => inventoryService.getAllDowntimes(),
    refetchOnMount: true,
  })

  const downtimes = downtimesData?.data || []

  const endDowntimeMutation = useMutation({
    mutationFn: inventoryService.endDowntimeEarly,
    onSuccess: () => {
      toast.success('Downtime Ended', 'Downtime has been ended successfully')
      queryClient.invalidateQueries({ queryKey: ['downtimes'] })
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to end downtime'
      toast.error('Error', errorMessage)
    },
  })

  const getDowntimeStatus = (downtime) => {
    const attrs = downtime.attributes || {}
    const now = new Date()
    const startAt = new Date(attrs.start_at)
    const endAt = new Date(attrs.end_at)
    const endedAt = attrs.ended_at ? new Date(attrs.ended_at) : null

    if (endedAt) {
      return { status: 'ended', label: 'Ended', variant: 'still' }
    }

    if (now < startAt) {
      return { status: 'scheduled', label: 'Scheduled', variant: 'info' }
    }

    if (now >= startAt && now < endAt) {
      return { status: 'active', label: 'Active', variant: 'warning' }
    }

    return { status: 'ended', label: 'Ended', variant: 'still' }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleEndDowntime = (downtimeId) => {
    endDowntimeMutation.mutate(downtimeId)
  }

  const filteredDowntimes = downtimes.filter((downtime) => {
    if (!search) return true
    const attrs = downtime.attributes || {}
    const product = attrs.product || {}
    const searchLower = search.toLowerCase()
    return (
      product.name?.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower) ||
      attrs.reason?.toLowerCase().includes(searchLower)
    )
  })

  const reasonLabels = {
    maintenance: 'Maintenance',
    equipment_repair: 'Equipment Repair',
    inspection: 'Inspection',
    cleaning: 'Cleaning',
    other: 'Other',
  }

  return (
    <div className="bg-gray-50 montserrat min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col mb-6">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">Downtimes</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manage scheduled maintenance periods for variant stocks.
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="w-full">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, description, or reason..."
            />
          </div>
            <Button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200! hover:bg-gray-300! text-gray-700!"
              auto
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              
            </Button>
        </div>

        <div className="bg-white overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                 
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Start
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    End
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Reason
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8">
                      <TableSkeleton />
                    </td>
                  </tr>
                ) : filteredDowntimes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      {search ? 'No downtimes found matching your search' : 'No downtimes found'}
                    </td>
                  </tr>
                ) : (
                  filteredDowntimes.map((downtime) => {
                    const attrs = downtime.attributes || {}
                    const product = attrs.product || {}
                    const images = attrs.images || []
                    const status = getDowntimeStatus(downtime)
                    const isEnded = status.status === 'ended'
                    const isActive = status.status === 'active'

                    return (
                      <tr key={downtime.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-4 max-w-[200px]">
                          <div className="flex items-center gap-3">
                            {images.length > 0 && (
                              <img
                                src={images[0].url}
                                alt={product.name || 'Product'}
                                className="h-12 w-12 object-cover rounded-lg"
                              />
                            )}

                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {product.name || '—'}
                              </div>
                              {product.description && (
                                <div className="text-sm text-gray-500 truncate max-w-[120px]">
                                  {product.description}
                                </div>
                              )}
                              {attrs.warehouse_name && (
                                <div className="text-xs text-primary capitalize font-medium italic">
                                  {attrs.warehouse_name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                       
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                          {formatDate(attrs.start_at)}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                          {attrs.ended_at ? (
                            <div>
                              <div className="text-xs text-gray-400">Ended: {formatDate(attrs.ended_at)}</div>
                              <div className="text-xs text-gray-400">Scheduled: {formatDate(attrs.end_at)}</div>
                            </div>
                          ) : (
                            formatDate(attrs.end_at)
                          )}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {reasonLabels[attrs.reason] || attrs.reason || '—'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {!isEnded && (
                            <div className="flex items-center justify-end">
                              <SlideToggle
                                value={isActive}
                                onChange={() => {
                                  if (isActive) {
                                    handleEndDowntime(downtime.id)
                                  }
                                }}
                                disabled={endDowntimeMutation.isPending || !isActive}
                                onLabel="Active"
                                offLabel={status.status === 'scheduled' ? 'Scheduled' : 'End'}
                                containerClassName="justify-end"
                              />
                            </div>
                          )}
                          {isEnded && (
                            <span className="text-xs text-gray-400">Ended</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Downtimes
