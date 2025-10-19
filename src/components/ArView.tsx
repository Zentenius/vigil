"use client"
import { useEffect, useRef, useState } from 'react'
import { Button } from '~/components/ui/button'
import { ArrowLeft, MapPin, AlertTriangle, Navigation, Crosshair } from 'lucide-react'
import Link from 'next/link'

interface HazardMarker {
  id: string
  // AR expects lat/lng fields for gps-entity-place usage
  lat: number
  lng: number
  // Map to your Report.category values from db (use string for safety)
  category: string
  location_name?: string | null
  tags?: string[]
  // severity maps to severity_level in DB
  severity: number
  description: string
  color?: string
  createdAt?: string
  user?: { name?: string | null; email?: string | null } | null
}

export default function ARView() {
  const sceneRef = useRef<HTMLElement>(null)
  const [isARReady, setIsARReady] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [nearbyMarkers, setNearbyMarkers] = useState<HazardMarker[]>([])
  const [error, setError] = useState<string | null>(null)

  // Simple distance calculation (same as your current filterMarkersByDistance)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3
    const φ1 = lat1 * Math.PI/180
    const φ2 = lat2 * Math.PI/180
    const Δφ = (lat2-lat1) * Math.PI/180
    const Δλ = (lng2-lng1) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
  }

  // Load hazards from database (replace this function for your project)
  const categoryColor = (category: string) => {
    switch ((category || '').toUpperCase()) {
      case 'EMERGENCY':
        return '#ef4444'
      case 'HAZARD':
        return '#f97316'
      case 'INFRASTRUCTURE':
        return '#3b82f6'
      case 'ENVIRONMENTAL':
        return '#10b981'
      case 'OTHER':
        return '#6b7280'
      default:
        return '#84cc16'
    }
  }

  const loadNearbyHazards = async (userLat: number, userLng: number) => {
    try {
      // Fetch reports from the API (uses db under the hood)
      const res = await fetch('/api/report')
      if (!res.ok) throw new Error('Failed to fetch reports')
      const reports = await res.json()

      // Map DB reports to HazardMarker array expected by the AR scene
      const mapped: HazardMarker[] = (reports || []).map((r: any) => ({
        id: r.id,
        lat: r.latitude,
        lng: r.longitude,
        category: r.category,
        location_name: r.location_name,
        tags: r.tags || [],
        severity: r.severity_level,
        description: r.description,
        color: categoryColor(r.category),
        createdAt: r.createdAt,
        user: r.user || null,
      }))

      // Filter by distance (keep your existing 150m threshold)
      const nearby = mapped.filter(hazard => {
        const distance = calculateDistance(userLat, userLng, hazard.lat, hazard.lng)
        return distance <= 150
      })

      setNearbyMarkers(nearby)
    } catch (error) {
      console.error('Failed to load hazards from DB:', error)
    }
  }

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ lat: latitude, lng: longitude })
        
        // Load hazards near this location
        loadNearbyHazards(latitude, longitude)
        setError(null)
      },
      (error) => {
        console.error('Location error:', error)
        setError('Unable to get location. Please enable GPS and refresh.')
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    )
  }, [])

  useEffect(() => {
    // Load AR scripts (same as before)
    const loadScripts = async () => {
      if (typeof window !== 'undefined') {
        const aframeScript = document.createElement('script')
        aframeScript.src = 'https://aframe.io/releases/1.4.0/aframe.min.js'
        aframeScript.onload = async () => {
          const arScript = document.createElement('script')
          arScript.src = 'https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar-nft.js'
          arScript.onload = () => setIsARReady(true)
          document.head.appendChild(arScript)
        }
        document.head.appendChild(aframeScript)
      }
    }
    loadScripts()
  }, [])

  // Simple render - just loop through nearbyMarkers
  const renderMarkers = () => {
    if (!userLocation) return null
    
    return nearbyMarkers.map(marker => {
      // Calculate distance for scaling
      const distance = calculateDistance(userLocation.lat, userLocation.lng, marker.lat, marker.lng)
      
      // Scale based on distance (closer = smaller, farther = bigger to maintain visibility)
      // Base size 2.0 (bigger default), scale factor based on distance
      const baseSize = 2.0
      const scaleFactor = Math.max(0.5, Math.min(2.0, distance / 50)) // Scale between 0.5x and 2x
      const finalSize = baseSize * scaleFactor
      
      return (
        <a-entity key={marker.id} gps-entity-place={`latitude: ${marker.lat}; longitude: ${marker.lng}`}>
          {/* Glowing beam - also scales with distance */}
          <a-cylinder
            position="0 0.8 0"
            height={finalSize * 1.2}
            radius="0.08"
            color={marker.color}
            material={`color: ${marker.color}; opacity: 0.6; emissive: ${marker.color}`}
            animation="property: material.emissiveIntensity; to: 0.8; dir: alternate; loop: true; dur: 1500"
          />
          
          {/* Main cube - scaled based on distance */}
          <a-box
            position={`0 ${finalSize} 0`}
            width={finalSize}
            height={finalSize}
            depth={finalSize}
            color={marker.color}
            material={`color: ${marker.color}; emissive: ${marker.color}; emissiveIntensity: 0.2`}
            animation="property: rotation; to: 0 360 0; loop: true; dur: 4000"
          />
          
          {/* Text - also scales with distance */}
          <a-text
            value={`${marker.description}\nSeverity: ${marker.severity}\n${Math.round(distance)}m`}
            position={`0 ${finalSize + 0.8} 0`}
            align="center"
            color="white"
            look-at="[gps-camera]"
            scale={`${scaleFactor} ${scaleFactor} ${scaleFactor}`}
          />
        </a-entity>
      )
    })
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-black p-4">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">AR Error</h2>
        <p className="text-center mb-4">{error}</p>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Map
          </Button>
        </Link>
      </div>
    )
  }

  if (!isARReady || !userLocation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
        <p className="text-lg">Initializing AR Camera...</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Back button */}
      <div className="fixed top-4 left-4 z-50">
        <Link href="/">
          <Button variant="outline" size="sm" className="bg-black bg-opacity-80 text-white border-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      {/* Info panel */}
      <div className="fixed top-4 right-4 z-50 bg-black bg-opacity-80 text-white p-3 rounded max-w-xs">
        <div className="flex items-center mb-2">
          <MapPin className="w-4 h-4 mr-2" />
          <span className="text-sm">Nearby: {nearbyMarkers.length} hazards</span>
        </div>
        {userLocation && (
          <p className="text-xs text-gray-300">
            📍 {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
          </p>
        )}
      </div>

      {/* A-Frame AR Scene */}
      <a-scene
        ref={sceneRef}
        embedded
        arjs="sourceType: webcam; videoTexture: true;"
        vr-mode-ui="enabled: false"
        style={{ width: '100vw', height: '100vh' }}
      >
        <a-camera
          gps-camera="positionMinAccuracy: 50; gpsMinDistance: 5"
          rotation-reader
        />

        {/* Render markers from database */}
        {renderMarkers()}

        <a-light type="ambient" color="#404040" intensity="0.6" />
        <a-light type="directional" position="2 10 5" color="#ffffff" intensity="0.8" />
      </a-scene>
    </div>
  )
}