import { useEffect, useRef, useState } from 'react'
import { loadGoogleMapsScript } from '@/utils/googleMaps'
import { MapPin } from 'lucide-react'

const LocationPicker = ({ 
  latitude, 
  longitude, 
  onLocationChange,
  height = '400px',
  zoom = 10,
  disabled = false 
}) => {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentLocation, setCurrentLocation] = useState({ lat: latitude, lng: longitude })

  useEffect(() => {
    let isMounted = true

    const initMap = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        await loadGoogleMapsScript()
        
        if (!isMounted || !mapRef.current) return

        const initialLat = latitude || 5.6037
        const initialLng = longitude || -0.1870

        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: initialLat, lng: initialLng },
          zoom: zoom,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        })

        mapInstanceRef.current = map

        // Create marker with default red pin (more visible)
        const marker = new window.google.maps.Marker({
          position: { lat: initialLat, lng: initialLng },
          map: map,
          draggable: !disabled,
          animation: window.google.maps.Animation.DROP,
          // Use default red pin marker for better visibility
        })

        markerRef.current = marker

        // Handle marker drag
        if (!disabled) {
          marker.addListener('dragend', (e) => {
            const newLat = e.latLng.lat()
            const newLng = e.latLng.lng()
            setCurrentLocation({ lat: newLat, lng: newLng })
            if (onLocationChange) {
              onLocationChange(newLat, newLng)
            }
          })
        }

        // Handle map click
        if (!disabled) {
          map.addListener('click', (e) => {
            const newLat = e.latLng.lat()
            const newLng = e.latLng.lng()
            marker.setPosition({ lat: newLat, lng: newLng })
            setCurrentLocation({ lat: newLat, lng: newLng })
            if (onLocationChange) {
              onLocationChange(newLat, newLng)
            }
          })
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
  }, [])

  useEffect(() => {
    const isValidCoordinate = (coord) => {
      return typeof coord === 'number' && !isNaN(coord) && isFinite(coord)
    }

    if (mapInstanceRef.current && markerRef.current) {
      const newLat = isValidCoordinate(latitude) ? latitude : currentLocation.lat
      const newLng = isValidCoordinate(longitude) ? longitude : currentLocation.lng
      
      if (isValidCoordinate(newLat) && isValidCoordinate(newLng) && 
          (newLat !== currentLocation.lat || newLng !== currentLocation.lng)) {
        const newPosition = { lat: newLat, lng: newLng }
        markerRef.current.setPosition(newPosition)
        mapInstanceRef.current.setCenter(newPosition)
        setCurrentLocation({ lat: newLat, lng: newLng })
      }
    }
  }, [latitude, longitude, currentLocation])

  if (error) {
    return (
      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
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
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading map...</p>
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        style={{ height, width: '100%' }}
        className="rounded-lg border border-gray-300"
      />
      {!disabled && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Select Location on Map</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Click anywhere on the map to place the pin</li>
                <li>Or drag the red marker to your desired location</li>
                <li>Coordinates will update automatically</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LocationPicker
