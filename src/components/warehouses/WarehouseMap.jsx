import { useEffect, useRef, useState } from 'react'
import { loadGoogleMapsScript } from '@/utils/googleMaps'

const WarehouseMap = ({ 
  warehouses = [],
  center = { lat: 5.6037, lng: -0.1870 },
  zoom = 10,
  height = '500px'
}) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    const initMap = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        await loadGoogleMapsScript()
        
        if (!isMounted || !mapRef.current) return

        const isValidCoordinate = (coord) => {
          return typeof coord === 'number' && !isNaN(coord) && isFinite(coord)
        }

        const validCenter = {
          lat: isValidCoordinate(center?.lat) ? center.lat : 5.6037,
          lng: isValidCoordinate(center?.lng) ? center.lng : -0.1870,
        }

        const map = new window.google.maps.Map(mapRef.current, {
          center: validCenter,
          zoom: zoom,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        })

        mapInstanceRef.current = map

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null))
        markersRef.current = []

        // Add markers for each warehouse
        if (warehouses.length > 0) {
          const bounds = new window.google.maps.LatLngBounds()
          const isValidCoordinate = (coord) => {
            return typeof coord === 'number' && !isNaN(coord) && isFinite(coord)
          }

          warehouses.forEach((warehouse) => {
            const lat = warehouse.attributes?.latitude
            const lng = warehouse.attributes?.longitude

            // Convert to number if string
            const latNum = typeof lat === 'string' ? parseFloat(lat) : lat
            const lngNum = typeof lng === 'string' ? parseFloat(lng) : lng

            if (isValidCoordinate(latNum) && isValidCoordinate(lngNum)) {
              const position = { lat: latNum, lng: lngNum }
              bounds.extend(position)

              const marker = new window.google.maps.Marker({
                position: position,
                map: map,
                title: warehouse.attributes?.name || 'Warehouse',
                animation: window.google.maps.Animation.DROP,
                label: {
                  text: warehouse.attributes?.name || 'Warehouse',
                  color: '#1f2937',
                  fontSize: '12px',
                  fontWeight: '600',
                  className: 'warehouse-marker-label'
                }
              })

              const infoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div class="p-2">
                    <h3 class="font-semibold text-sm mb-1">${warehouse.attributes?.name || 'Warehouse'}</h3>
                    ${warehouse.attributes?.county ? `<p class="text-xs text-gray-600">${warehouse.attributes.county}</p>` : ''}
                    ${warehouse.attributes?.city ? `<p class="text-xs text-gray-600">${warehouse.attributes.city}</p>` : ''}
                    ${warehouse.attributes?.region ? `<p class="text-xs text-gray-600">${warehouse.attributes.region}</p>` : ''}
                    ${warehouse.attributes?.country ? `<p class="text-xs text-gray-600">${warehouse.attributes.country}</p>` : ''}
                  </div>
                `,
              })

              marker.addListener('click', () => {
                infoWindow.open(map, marker)
              })

              markersRef.current.push(marker)
            }
          })

          // Fit bounds to show all markers
          if (markersRef.current.length > 1) {
            try {
              const ne = bounds.getNorthEast()
              const sw = bounds.getSouthWest()
              if (ne.lat() !== sw.lat() || ne.lng() !== sw.lng()) {
                map.fitBounds(bounds)
                const listener = window.google.maps.event.addListener(map, 'bounds_changed', () => {
                  if (map.getZoom() > 15) {
                    map.setZoom(15)
                  }
                  window.google.maps.event.removeListener(listener)
                })
              } else {
                const firstWarehouse = warehouses.find(w => {
                  const lat = w.attributes?.latitude
                  const lng = w.attributes?.longitude
                  return isValidCoordinate(lat) && isValidCoordinate(lng)
                })
                if (firstWarehouse) {
                  map.setCenter({
                    lat: firstWarehouse.attributes.latitude,
                    lng: firstWarehouse.attributes.longitude,
                  })
                  map.setZoom(12)
                }
              }
            } catch (err) {
              console.error('Error fitting bounds:', err)
              const firstWarehouse = warehouses.find(w => {
                const lat = w.attributes?.latitude
                const lng = w.attributes?.longitude
                return isValidCoordinate(lat) && isValidCoordinate(lng)
              })
              if (firstWarehouse) {
                map.setCenter({
                  lat: firstWarehouse.attributes.latitude,
                  lng: firstWarehouse.attributes.longitude,
                })
                map.setZoom(12)
              }
            }
          } else if (markersRef.current.length === 1) {
            const firstWarehouse = warehouses.find(w => {
              const lat = w.attributes?.latitude
              const lng = w.attributes?.longitude
              return isValidCoordinate(lat) && isValidCoordinate(lng)
            })
            if (firstWarehouse) {
              map.setCenter({
                lat: firstWarehouse.attributes.latitude,
                lng: firstWarehouse.attributes.longitude,
              })
              map.setZoom(12)
            } else {
              map.setCenter(validCenter)
            }
          } else {
            map.setCenter(validCenter)
          }
        } else {
          map.setCenter(validCenter)
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Error initializing map:', err)
        setError(err.message)
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      isMounted = false
    }
  }, [warehouses, center, zoom])

  if (error) {
    return (
      <div className="border border-red-200 p-4 bg-red-50">
        <p className="text-red-600 text-sm">{error}</p>
        <p className="text-red-500 text-xs mt-2">
          Please check your Google Maps API key configuration.
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading map...</p>
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        style={{ height, width: '100%' }}
        className=""
      />
    </div>
  )
}

export default WarehouseMap
