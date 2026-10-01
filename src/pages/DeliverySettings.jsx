import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import { deliveryService } from '@/services/delivery.service'
import { useToast } from '@/hooks/useToast'
import Button from '@/components/ui/Button'
import CenterModal from '@/components/ui/CenterModal'
import Select from '@/components/ui/Select'
import TableSkeleton from '@/components/ui/TableSkeleton'

const pricingZones = ['near', 'far']
const ghanaRegions = [
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
]

const pricingZoneOptions = pricingZones.map((zone) => ({ value: zone, label: zone }))
const regionOptions = ghanaRegions.map((region) => ({ value: region, label: region }))

const valueFromForm = (form, name) => {
  const value = form.get(name)
  return value === '' ? null : value
}

const DeliverySettings = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [dirtyZoneIds, setDirtyZoneIds] = useState(() => new Set())
  const [addZoneOpen, setAddZoneOpen] = useState(false)

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
    onSuccess: () => {
      toast.success('Saved', 'Delivery zone saved')
      setAddZoneOpen(false)
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] })
    },
    onError: (error) => {
      const message = error.response?.data?.errors?.join(', ') || error.response?.data?.error || 'Update failed'
      toast.error('Delivery Settings', message)
    },
  })
  const updateZone = useMutation({
    mutationFn: ({ id, data }) => deliveryService.updateZone(id, data),
    onSuccess: (_data, variables) => {
      toast.success('Saved', 'Delivery zone updated')
      setDirtyZoneIds((current) => {
        const next = new Set(current)
        next.delete(variables.id)
        return next
      })
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] })
    },
    onError: (error) => {
      const message = error.response?.data?.errors?.join(', ') || error.response?.data?.error || 'Update failed'
      toast.error('Delivery Settings', message)
    },
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

  const markZoneDirty = (id) => {
    setDirtyZoneIds((current) => {
      if (current.has(id)) return current
      const next = new Set(current)
      next.add(id)
      return next
    })
  }

  const handleZoneSubmit = (event, id) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const data = {
      name: valueFromForm(form, 'name'),
      code: valueFromForm(form, 'code'),
      pricing_zone: valueFromForm(form, 'pricing_zone'),
      region: valueFromForm(form, 'region'),
      city: valueFromForm(form, 'city'),
      town: valueFromForm(form, 'town'),
      market_name: valueFromForm(form, 'market_name'),
      station_name: valueFromForm(form, 'station_name'),
      region_open: form.get('region_open') === 'on',
      city_open: form.get('city_open') === 'on',
      town_open: form.get('town_open') === 'on',
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
              <SectionHeader
                title="Delivery Zones"
                action={(
                  <Button auto className="gap-2 whitespace-nowrap" onClick={() => setAddZoneOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Add zone
                  </Button>
                )}
              />
              <div className="overflow-x-auto bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <Th>Name</Th>
                      <Th>Code</Th>
                      <Th>Zone</Th>
                      <Th>Region</Th>
                      <Th>City</Th>
                      <Th>Town</Th>
                      <Th>Market</Th>
                      <Th>Station</Th>
                      <Th>Open</Th>
                      <Th>Active</Th>
                      <Th></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {zones.map((zone) => {
                      const attrs = zone.attributes || {}
                      const formId = `delivery-zone-${zone.id}`
                      const isDirty = dirtyZoneIds.has(zone.id)
                      const onZoneChange = () => markZoneDirty(zone.id)
                      return (
                        <tr key={zone.id} className="border-t border-gray-100">
                          <td className="hidden">
                            <form id={formId} onSubmit={(event) => handleZoneSubmit(event, zone.id)} />
                          </td>
                          <Td><TextField form={formId} name="name" defaultValue={attrs.name} onChange={onZoneChange} required /></Td>
                          <Td><TextField form={formId} name="code" defaultValue={attrs.code} onChange={onZoneChange} required /></Td>
                          <Td><ZoneSelect form={formId} name="pricing_zone" defaultValue={attrs.pricing_zone} onValueChange={onZoneChange} /></Td>
                          <Td><RegionSelect form={formId} name="region" defaultValue={attrs.region} onValueChange={onZoneChange} /></Td>
                          <Td><TextField form={formId} name="city" defaultValue={attrs.city} onChange={onZoneChange} /></Td>
                          <Td><TextField form={formId} name="town" defaultValue={attrs.town} onChange={onZoneChange} /></Td>
                          <Td><TextField form={formId} name="market_name" defaultValue={attrs.market_name} onChange={onZoneChange} /></Td>
                          <Td><TextField form={formId} name="station_name" defaultValue={attrs.station_name} onChange={onZoneChange} /></Td>
                          <Td>
                            <div className="grid gap-1">
                              <CheckboxField form={formId} name="region_open" label="Region" defaultChecked={attrs.region_open} onChange={onZoneChange} />
                              <CheckboxField form={formId} name="city_open" label="City" defaultChecked={attrs.city_open} onChange={onZoneChange} />
                              <CheckboxField form={formId} name="town_open" label="Town" defaultChecked={attrs.town_open} onChange={onZoneChange} />
                            </div>
                          </Td>
                          <Td>
                            <input form={formId} name="active" type="checkbox" defaultChecked={attrs.active} onChange={onZoneChange} className="h-4 w-4 accent-primary" />
                          </Td>
                          <Td><RowActions formId={formId} canSave={isDirty} isSaving={updateZone.isPending} onDelete={() => deleteZone.mutate(zone.id)} /></Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <CenterModal
              open={addZoneOpen}
              onClose={() => setAddZoneOpen(false)}
              heading="Add Delivery Zone"
              className="max-w-3xl"
            >
              <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={(event) => handleZoneSubmit(event)}>
                <TextField name="name" placeholder="Name" required />
                <TextField name="code" placeholder="Code" required />
                <ZoneSelect name="pricing_zone" />
                <RegionSelect name="region" />
                <TextField name="city" placeholder="City" />
                <TextField name="town" placeholder="Town" />
                <TextField name="market_name" placeholder="Market" />
                <TextField name="station_name" placeholder="Station" />
                <div className="grid gap-2 sm:col-span-2">
                  <CheckboxField name="region_open" label="Open region" />
                  <CheckboxField name="city_open" label="Open city" />
                  <CheckboxField name="town_open" label="Open town" />
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input name="active" type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
                    Active
                  </label>
                </div>
                <div className="flex justify-end gap-2 sm:col-span-2 pt-2">
                  <Button
                    type="button"
                    auto
                    className="bg-gray-200! text-gray-700! hover:bg-gray-100"
                    onClick={() => setAddZoneOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" auto className="gap-2 whitespace-nowrap" isLoading={createZone.isPending} loadingText="Saving">
                    <Plus className="w-4 h-4" />
                    Add zone
                  </Button>
                </div>
              </form>
            </CenterModal>

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

const SectionHeader = ({ title, action }) => (
  <div className="flex items-center justify-between gap-3">
    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
    {action}
  </div>
)

const TextField = ({ className = '', ...props }) => (
  <input
    className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-primary ${className}`}
    {...props}
  />
)

const FormSelect = ({ name, form, defaultValue = '', options, placeholder = 'Select', onValueChange }) => {
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  const handleChange = (event) => {
    setValue(event.target.value)
    onValueChange?.(event.target.value)
  }

  return (
    <>
      <Select
        value={value}
        onChange={handleChange}
        options={options}
        placeholder={placeholder}
        selectClassName="rounded-lg px-3 py-2 text-sm"
      />
      <input type="hidden" form={form} name={name} value={value} />
    </>
  )
}

const ZoneSelect = ({ defaultValue = 'near', ...props }) => (
  <FormSelect defaultValue={defaultValue} options={pricingZoneOptions} placeholder="Zone" {...props} />
)

const RegionSelect = ({ defaultValue = '', ...props }) => (
  <FormSelect defaultValue={defaultValue} options={regionOptions} placeholder="Region" {...props} />
)

const CheckboxField = ({ label, className = '', ...props }) => (
  <label className={`flex items-center gap-2 text-sm text-gray-700 ${className}`}>
    <input type="checkbox" className="h-4 w-4 accent-primary" {...props} />
    {label}
  </label>
)

const IconButton = ({ label, icon }) => (
  <Button type="submit" auto className="gap-2 whitespace-nowrap">
    {icon}
    {label}
  </Button>
)

const Th = ({ children }) => <th className="px-3 py-2 text-left font-medium">{children}</th>
const Td = ({ children }) => <td className="px-3 py-2 align-middle">{children}</td>

const RowActions = ({ formId, onDelete, canSave = true, isSaving = false }) => (
  <div className="flex items-center gap-2">
    <button
      form={formId}
      type="submit"
      disabled={!canSave || isSaving}
      className={`p-2 rounded-lg ${canSave && !isSaving ? 'text-primary hover:bg-orange-50' : 'text-gray-300 cursor-not-allowed'}`}
      aria-label="Save row"
    >
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
