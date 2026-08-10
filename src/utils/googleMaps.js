/**
 * Loads Google Maps JavaScript API script
 * @returns {Promise} Promise that resolves when Google Maps is loaded
 */
export const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      resolve(window.google.maps)
      return
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval)
          resolve(window.google.maps)
        }
      }, 100)
      return
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      reject(new Error('Google Maps API key is not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file.'))
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps)
      } else {
        reject(new Error('Google Maps failed to load'))
      }
    }
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps script'))
    }
    document.head.appendChild(script)
  })
}

/**
 * Gets the Google Maps API key from environment variables
 * @returns {string|null} API key or null if not configured
 */
export const getGoogleMapsApiKey = () => {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || null
}
