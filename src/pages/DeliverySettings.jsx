import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Save, Trash2 } from 'lucide-react'
import { deliveryService } from '@/services/delivery.service'
import { useToast } from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import TableSkeleton from '@/components/ui/TableSkeleton'

const pricingZones = ['near', 'far']

const valueFromForm = (form, name) => {
  const value = form.get(name)
  return value === '' ? null : value
}

const DeliverySettings = () => {
  const toast = useToast()
  const queryClient = useQueryClient()

  const zonesQuery = useQuery({ queryKey: ['delivery-zones'], queryFn: deliveryService.getZones })
  const tiersQuery = useQuery({ queryKey: ['delivery-weight-tiers'], queryFn: deliveryService.getWeightTiers })
  const ratesQuery = useQuery({ queryKey: ['delivery-high-value-rates'], queryFn: deliveryService.getHighValueRates })
  const settingsQuery = useQuery({ queryKey: ['delivery-settings'], queryFn: deliveryService.getSettings })

  const mutationOptions = (key, successMessage) => ({
    onSuccess: () => {
      toast.success('Saved', successMessage)
      queryClient.invalidateQueries({ queryKey: [key] })
    },
    onError: (error) => {
      const message = error.response?.data?.errors?.join(', ') || error.response?.data?.error || 'Update failed'
      toast.error('Delivery Settings', message)
    },
  })

  const createZone = useMutation({
    mutationFn: deliveryService.createZone,
    ...mutationOptions('delivery-zones', 'Delivery zone saved'),
  })
  const updateZone = useMutation({
    mutationFn: ({ id, data }) => deliveryService.updateZone(id, data),
    ...mutationOptions('delivery-zones', 'Delivery zone updated'),
  })
  const deleteZone = useMutation({
    mutationFn: deliveryService.deleteZone,
    ...mutationOptions('delivery-zones', 'Delivery zone deleted'),
  })

  const createTier = useMutation({
    mutationFn: deliveryService.createWeightTier,
    ...mutationOptions('delivery-weight-tiers', 'Bulk tier saved'),
  })
  const updateTier = useMutation({
    mutationFn: ({ id, data }) => deliveryService.updateWeightTier(id, data),
    ...mutationOptions('delivery-weight-tiers', 'Bulk tier updated'),
  })
  const deleteTier = useMutation({
    mutationFn: deliveryService.deleteWeightTier,
    ...mutationOptions('delivery-weight-tiers', 'Bulk tier deleted'),
  })

  const createRate = useMutation({
    mutationFn: deliveryService.createHighValueRate,
    ...mutationOptions('delivery-high-value-rates', 'High-value rate saved'),
  })
  const updateRate = useMutation({
    mutationFn: ({ id, data }) => deliveryService.updateHighValueRate(id, data),
    ...mutationOptions('delivery-high-value-rates', 'High-value rate updated'),
  })
  const deleteRate = useMutation({
    mutationFn: deliveryService.deleteHighValueRate,
    ...mutationOptions('delivery-high-value-rates', 'High-value rate deleted'),
  })

  const updateSettings = useMutation({
    mutationFn: deliveryService.updateSettings,
    onSuccess: () => {
      toast.success('Saved', 'Delivery setting updated')
      queryClient.invalidateQueries({ queryKey: ['delivery-settings'] })
    },
    onError: (error) => {
      const message = error.response?.data?.errors?.join(', ') || error.response?.data?.error || 'Update failed'
      toast.error('Delivery Settings', message)
    },
  })

  const zones = zonesQuery.data?.data || []
  const tiers = tiersQuery.data?.data || []
  const rates = ratesQuery.data?.data || []
  const multiplier = settingsQuery.data?.data?.attributes?.high_value_additional_unit_multiplier ?? 0.75
  const isLoading = zonesQuery.isLoading || tiersQuery.isLoading || ratesQuery.isLoading || settingsQuery.isLoading

  const handleZoneSubmit = (event, id) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const data = {
      name: valueFromForm(form, 'name'),
      code: valueFromForm(form, 'code'),
      pricing_zone: valueFromForm(form, 'pricing_zone'),
      region: valueFromForm(form, 'region'),
      city: valueFromForm(form, 'city'),
      station_name: valueFromForm(form, 'station_name'),
      active: form.get('active') === 'on',
    }
    id ? updateZone.mutate({ id, data }) : createZone.mutate(data)
    if (!id) event.currentTarget.reset()
  }

  const handleTierSubmit = (event, id) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const data = {
      pricing_zone: valueFromForm(form, 'pricing_zone'),
      min_weight_kg: valueFromForm(form, 'min_weight_kg'),
      max_weight_kg: valueFromForm(form, 'max_weight_kg'),
      fee: valueFromForm(form, 'fee'),
    }
    id ? updateTier.mutate({ id, data }) : createTier.mutate(data)
    if (!id) event.currentTarget.reset()
  }

  const handleRateSubmit = (event, id) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const data = {
      pricing_zone: valueFromForm(form, 'pricing_zone'),
      shipping_category: valueFromForm(form, 'shipping_category'),
      fee: valueFromForm(form, 'fee'),
    }
    id ? updateRate.mutate({ id, data }) : createRate.mutate(data)
    if (!id) event.currentTarget.reset()
  }

  const handleSettingsSubmit = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    updateSettings.mutate({
      high_value_additional_unit_multiplier: valueFromForm(form, 'multiplier'),
    })
  }

  return (
    <div className="bg-gray-50 montserrat min-h-screen">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold">Delivery Settings</h1>
          <p className="text-sm text-gray-600">Configure delivery zones, bulk tiers, and fragile-item rates.</p>
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : (
          <>
            <section className="space-y-3">
              <SectionHeader title="Delivery Zones" />
              <form className="grid grid-cols-1 md:grid-cols-8 gap-2" onSubmit={(event) => handleZoneSubmit(event)}>
                <TextField name="name" placeholder="Name" required />
                <TextField name="code" placeholder="Code" required />
                <ZoneSelect name="pricing_zone" />
                <TextField name="region" placeholder="Region" />
                <TextField name="city" placeholder="City" />
                <TextField name="station_name" placeholder="Station" />
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input name="active" type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
                  Active
                </label>
                <IconButton label="Add zone" icon={<Plus className="w-4 h-4" />} />
              </form>
              <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <Th>Name</Th>
                      <Th>Code</Th>
                      <Th>Zone</Th>
                      <Th>Region</Th>
                      <Th>City</Th>
                      <Th>Station</Th>
                      <Th>Active</Th>
                      <Th></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {zones.map((zone) => {
                      const attrs = zone.attributes || {}
                      const formId = `delivery-zone-${zone.id}`
                      return (
                        <tr key={zone.id} className="border-t border-gray-100">
                          <td className="hidden">
                            <form id={formId} onSubmit={(event) => handleZoneSubmit(event, zone.id)} />
                          </td>
                          <Td><TextField form={formId} name="name" defaultValue={attrs.name} required /></Td>
                          <Td><TextField form={formId} name="code" defaultValue={attrs.code} required /></Td>
                          <Td><ZoneSelect form={formId} name="pricing_zone" defaultValue={attrs.pricing_zone} /></Td>
                          <Td><TextField form={formId} name="region" defaultValue={attrs.region} /></Td>
                          <Td><TextField form={formId} name="city" defaultValue={attrs.city} /></Td>
                          <Td><TextField form={formId} name="station_name" defaultValue={attrs.station_name} /></Td>
                          <Td>
                            <input form={formId} name="active" type="checkbox" defaultChecked={attrs.active} className="h-4 w-4 accent-primary" />
                          </Td>
                          <Td><RowActions formId={formId} onDelete={() => deleteZone.mutate(zone.id)} /></Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3">
              <SectionHeader title="Bulk Weight Tiers" />
              <form className="grid grid-cols-1 md:grid-cols-5 gap-2" onSubmit={(event) => handleTierSubmit(event)}>
                <ZoneSelect name="pricing_zone" />
                <TextField name="min_weight_kg" type="number" step="0.01" placeholder="Min kg" required />
                <TextField name="max_weight_kg" type="number" step="0.01" placeholder="Max kg" />
                <TextField name="fee" type="number" step="0.01" placeholder="Fee" required />
                <IconButton label="Add tier" icon={<Plus className="w-4 h-4" />} />
              </form>
              <EditableSimpleTable
                rows={tiers}
                columns={['pricing_zone', 'min_weight_kg', 'max_weight_kg', 'fee']}
                onSubmit={handleTierSubmit}
                onDelete={(id) => deleteTier.mutate(id)}
              />
            </section>

            <section className="space-y-3">
              <SectionHeader title="High-Value Rates" />
              <form className="grid grid-cols-1 md:grid-cols-4 gap-2" onSubmit={(event) => handleRateSubmit(event)}>
                <ZoneSelect name="pricing_zone" />
                <TextField name="shipping_category" placeholder="phone, laptop" required />
                <TextField name="fee" type="number" step="0.01" placeholder="Fee" required />
                <IconButton label="Add rate" icon={<Plus className="w-4 h-4" />} />
              </form>
              <EditableSimpleTable
                rows={rates}
                columns={['pricing_zone', 'shipping_category', 'fee']}
                onSubmit={handleRateSubmit}
                onDelete={(id) => deleteRate.mutate(id)}
              />
            </section>

            <section className="space-y-3">
              <SectionHeader title="High-Value Quantity Discount" />
              <form className="grid grid-cols-1 sm:grid-cols-[220px_140px] gap-2" onSubmit={handleSettingsSubmit}>
                <TextField name="multiplier" type="number" step="0.01" min="0" defaultValue={multiplier} required />
                <IconButton label="Save" icon={<Save className="w-4 h-4" />} />
              </form>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default DeliverySettings

const SectionHeader = ({ title }) => (
  <div>
    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
  </div>
)

const TextField = ({ className = '', ...props }) => (
  <input
    className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-primary ${className}`}
    {...props}
  />
)

const ZoneSelect = ({ defaultValue = 'near', ...props }) => (
  <select
    defaultValue={defaultValue}
    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-primary"
    {...props}
  >
    {pricingZones.map((zone) => (
      <option key={zone} value={zone}>{zone}</option>
    ))}
  </select>
)

const IconButton = ({ label, icon }) => (
  <Button type="submit" auto className="gap-2 whitespace-nowrap">
    {icon}
    {label}
  </Button>
)

const Th = ({ children }) => <th className="px-3 py-2 text-left font-medium">{children}</th>
const Td = ({ children }) => <td className="px-3 py-2 align-middle">{children}</td>

const RowActions = ({ formId, onDelete }) => (
  <div className="flex items-center gap-2">
    <button form={formId} type="submit" className="p-2 rounded-lg text-primary hover:bg-orange-50" aria-label="Save row">
      <Save className="w-4 h-4" />
    </button>
    <button type="button" onClick={onDelete} className="p-2 rounded-lg text-red-600 hover:bg-red-50" aria-label="Delete row">
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
)

const EditableSimpleTable = ({ rows, columns, onSubmit, onDelete }) => (
  <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
    <table className="min-w-full text-sm">
      <thead className="bg-gray-50 text-gray-600">
        <tr>
          {columns.map((column) => <Th key={column}>{column.replaceAll('_', ' ')}</Th>)}
          <Th></Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const attrs = row.attributes || {}
          const formId = `delivery-row-${row.id}`
          return (
            <tr key={row.id} className="border-t border-gray-100">
              <td className="hidden">
                <form id={formId} onSubmit={(event) => onSubmit(event, row.id)} />
              </td>
              {columns.map((column) => (
                <Td key={column}>
                  {column === 'pricing_zone' ? (
                    <ZoneSelect form={formId} name={column} defaultValue={attrs[column]} />
                  ) : (
                    <TextField
                      form={formId}
                      name={column}
                      type={['fee', 'min_weight_kg', 'max_weight_kg'].includes(column) ? 'number' : 'text'}
                      step="0.01"
                      defaultValue={attrs[column] ?? ''}
                      required={column !== 'max_weight_kg'}
                    />
                  )}
                </Td>
              ))}
              <Td><RowActions formId={formId} onDelete={() => onDelete(row.id)} /></Td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
)
