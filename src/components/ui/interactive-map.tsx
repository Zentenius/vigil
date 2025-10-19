"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Toaster } from 'sonner'
import { LatLngExpression } from 'leaflet'
import { FlameIcon, DropletIcon, AlertTriangleIcon, BiohazardIcon, MapPin, Search } from 'lucide-react'

// Custom hook to manage map container cleanup
function useMapContainer() {
  const [mapKey, setMapKey] = useState<string>('')
  
  useEffect(() => {
    // Generate unique key for this map instance
    const key = `map-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setMapKey(key)
  }, [])
  
  return { mapKey }
}
import { Input } from './input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import { MapContainerWrapper } from './map-container-wrapper'
import { useLeafletCleanup } from './use-leaflet-cleanup'
import dynamic from 'next/dynamic'
import { Button } from './button'
import Link from 'next/link'

// Dynamically import map components to avoid SSR issues
const Map = dynamic(() => import('./map').then(mod => ({ default: mod.Map })), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">Loading map...</div>
})

const MapLayers = dynamic(() => import('./map').then(mod => ({ default: mod.MapLayers })), { ssr: false })
const MapLayersControl = dynamic(() => import('./map').then(mod => ({ default: mod.MapLayersControl })), { ssr: false })
const MapTileLayer = dynamic(() => import('./map').then(mod => ({ default: mod.MapTileLayer })), { ssr: false })
const MapLayerGroup = dynamic(() => import('./map').then(mod => ({ default: mod.MapLayerGroup })), { ssr: false })
const MapZoomControl = dynamic(() => import('./map').then(mod => ({ default: mod.MapZoomControl })), { ssr: false })
const MapLocateControl = dynamic(() => import('./map').then(mod => ({ default: mod.MapLocateControl })), { ssr: false })
const MapMarker = dynamic(() => import('./map').then(mod => ({ default: mod.MapMarker })), { ssr: false })
const MapPopup = dynamic(() => import('./map').then(mod => ({ default: mod.MapPopup })), { ssr: false })

// Dynamically import custom components
const TypedMarkerClusterGroup = dynamic(() => import('./typed-marked-cluster-group').then(mod => ({ default: mod.TypedMarkerClusterGroup })), { 
  ssr: false 
})

const ToggleableHeatmapLayer = dynamic(() => import('./toggleable-heatmap-layer').then(mod => ({ default: mod.ToggleableHeatmapLayer })), { 
  ssr: false 
})

const PredictiveLayer = dynamic(() => import('./predictive-layer').then(mod => ({ default: mod.PredictiveLayer })), { 
  ssr: false 
})



interface Report {
  id: string
  latitude: number
  longitude: number
  location_name: string | null
  category: string
  tags: string[]
  severity_level: number
  description: string
  createdAt: string
  user?: {
    name: string | null
    email: string | null
  }
}

interface InteractiveMapProps {
  reports: Report[]
  predictions?: any[] // PredictionResult[]
  className?: string
}

// Jamaica coordinates as default
const JAMAICA_CENTER: LatLngExpression = [18.009025, -76.777948]

export function InteractiveMap({ reports, predictions = [], className = "" }: InteractiveMapProps) {
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showPredictions, setShowPredictions] = useState(false)
  const [loadingPredictions, setLoadingPredictions] = useState(false)
  const [userLocation, setUserLocation] = useState<LatLngExpression | null>(null)
  const [mapCenter, setMapCenter] = useState<LatLngExpression>(JAMAICA_CENTER)
  const [isClient, setIsClient] = useState(false)
  const { mapKey } = useMapContainer()
  const mapRef = useRef<any>(null)
  const [searchText, setSearchText] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [selectedLayer, setSelectedLayer] = useState<string>('none')
  const [displayedPredictions, setDisplayedPredictions] = useState<any[]>([])

  // Use the cleanup hook to prevent container reinitialization
  useLeafletCleanup(`map-container-${mapKey}`)

  // Map report categories to hazard types with colors and icons
  const hazardTypes = [
    {
      name: "EMERGENCY",
      displayName: "Emergency",
      icon: <FlameIcon />,
      color: "#ef4444", // red
      reports: []
    },
    {
      name: "HAZARD", 
      displayName: "Hazards",
      icon: <AlertTriangleIcon />,
      color: "#f97316", // orange
      reports: []
    },
    {
      name: "INFRASTRUCTURE",
      displayName: "Infrastructure", 
      icon: <MapPin />,
      color: "#3b82f6", // blue
      reports: []
    },
    {
      name: "ENVIRONMENTAL",
      displayName: "Environmental",
      icon: <BiohazardIcon />,
      color: "#eab308", // yellow
      reports: []
    },
    {
      name: "OTHER",
      displayName: "Other Reports",
      icon: <AlertTriangleIcon />,
      color: "#6b7280", // gray
      reports: []
    }
  ]

  // Process reports into hazard types
  const processedHazardTypes = hazardTypes.map(hazardType => ({
    ...hazardType,
    reports: reports
      .filter(report => report.category === hazardType.name)
      .map(report => ({
        lat: report.latitude,
        lng: report.longitude,
        intensity: report.severity_level / 10, // Convert severity to decimal intensity
        description: report.description,
        severity: report.severity_level,
        location_name: report.location_name,
        reportedBy: report.user?.name || report.user?.email || 'Unknown User',
        createdAt: report.createdAt,
        tags: report.tags
      }))
  }))

  // Flatten all reports for heatmap
  const allHazardReports = processedHazardTypes.flatMap(type => 
    type.reports.map(report => ({
      ...report,
      type: type.displayName
    }))
  )

  // Force client-side only rendering and handle map cleanup
  useEffect(() => {
    setIsClient(true)
    
    // Cleanup function to ensure proper unmounting
    return () => {
      // Clean up any existing map instances
      if (mapRef.current) {
        try {
          mapRef.current.off()
          mapRef.current.remove()
          mapRef.current = null
        } catch (e) {
          // Ignore cleanup errors
          console.warn('Map cleanup error:', e)
        }
      }
    }
  }, [])

  // Sync selected layer to heatmap/predictions visibility and fetch on demand
  useEffect(() => {
    if (selectedLayer === 'heatmap') {
      setShowHeatmap(true)
      setShowPredictions(false)
    } else if (selectedLayer === 'predictive') {
      setShowHeatmap(false)
      setShowPredictions(true)
      // Fetch predictions on demand if not already loaded
      if (displayedPredictions.length === 0 && !loadingPredictions) {
        const center = Array.isArray(mapCenter) ? mapCenter : [mapCenter.lat, mapCenter.lng]
        fetchPredictionsOnDemand(center[0], center[1])
      }
    } else if (selectedLayer === 'none') {
      setShowHeatmap(false)
      setShowPredictions(false)
    }
  }, [selectedLayer])

  // Fetch predictions from the parent predictions prop when they change
  useEffect(() => {
    if (predictions.length > 0) {
      setDisplayedPredictions(predictions)
    }
  }, [predictions])

  // Function to fetch predictions on demand
  const fetchPredictionsOnDemand = async (lat: number, lng: number) => {
    try {
      setLoadingPredictions(true)
      const response = await fetch(
        `/api/predictions/nearby?lat=${lat}&lng=${lng}&radius=10000`
      )
      if (response.ok) {
        const data = await response.json()
        setDisplayedPredictions(data.predictions || [])
        console.log(`🔮 Loaded ${data.predictions?.length || 0} AI predictions`)
      }
    } catch (error) {
      console.error('Failed to fetch predictions:', error)
    } finally {
      setLoadingPredictions(false)
    }
  }

  // Request user location on component mount
  useEffect(() => {
    if (!isClient) return

    const requestLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords: LatLngExpression = [position.coords.latitude, position.coords.longitude]
            setUserLocation(coords)
            setMapCenter(coords)
            toast.success('📍 Location found!')
          },
          (error) => {
            console.error('Location error:', error)
            let userMessage = error.message
            if (error.message.includes('denied') || error.message.includes('permission')) {
              userMessage = '🚫 Location access denied. Using Jamaica as default location.'
            } else if (error.message.includes('unavailable')) {
              userMessage = '📍 GPS signal unavailable. Using Jamaica as default location.'
            } else if (error.message.includes('timeout')) {
              userMessage = '⏱️ Location request timed out. Using Jamaica as default location.'
            }
            toast.error(userMessage, { duration: 5000 })
            // Keep Jamaica as center if location fails
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        )
      } else {
        toast.error('🚫 Geolocation not supported by this browser')
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(requestLocation, 1000)
    return () => clearTimeout(timer)
  }, [isClient])

  const handleLocationFound = useCallback((location: any) => {
    const coords: LatLngExpression = [location.latlng.lat, location.latlng.lng]
    setUserLocation(coords)
    toast.success('📍 Location updated!')
  }, [])

  const handleLocationError = useCallback((error: any) => {
    console.error('Location error:', error.message)
    let userMessage = error.message
    if (error.message.includes('timed out') || error.message.includes('timeout')) {
      userMessage = '⏱️ Location request timed out. Try moving to an area with better signal.'
    } else if (error.message.includes('denied') || error.message.includes('permission')) {
      userMessage = '🚫 Location access denied. Please enable location permissions.'
    } else if (error.message.includes('unavailable')) {
      userMessage = '📍 GPS signal weak. Try moving to an area with better signal.'
    }
    toast.error(userMessage, { duration: 8000 })
  }, [])

  // Don't render on server or before client is ready
  if (!isClient || typeof window === 'undefined') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className={`flex flex-col h-full ${className}`}>
        {/* Toggle Controls
        <div className="mb-4 flex gap-4 p-4">
          <button
            onClick={() => {
              setSelectedLayer(prev => (prev === 'heatmap' ? 'none' : 'heatmap'))
            }}
            className={`px-4 py-2 rounded-md transition-colors ${
              showHeatmap 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {showHeatmap ? '🔥 Hide Hazard Heatmap' : '📊 Show Hazard Heatmap'}
          </button>
        </div> */}

        {/* User Location Display */}
        {userLocation && (
          <div className="mb-4 mx-4 text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded">
            📍 Your location: {Array.isArray(userLocation) ? `${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}` : 'Unknown'}
          </div>
        )}

        <div className="flex-1 border rounded-lg overflow-hidden mx-4 relative">
          {/* Absolute controls over the map */}
          <div className="absolute top-4 z-30 w-full flex left-[5.5rem] max-w-2xl">
            <div className="backdrop-blur-sm bg-white/40 border border-white/30 rounded-full shadow-md p-2 flex items-center gap-2">
              {/* Search input (not functional yet) */}
              <div className="flex-1 relative text-white">
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText((e.target as HTMLInputElement).value)}
                  placeholder="Search"
                  className="bg-transparent rounded-full placeholder:text-white/80 text-white border border-white/30"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-white/90" />
              </div>

              {/* Severity select */}
              <div className="w-40">
                <Select value={selectedSeverity} onValueChange={(val) => setSelectedSeverity(val)}>
                  <SelectTrigger className="bg-transparent rounded-full border-white/30 text-white">
                    <SelectValue placeholder="Severity">{selectedSeverity}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="safe">Safe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Layers select */}
              <div className="w-44">
                <Select value={selectedLayer} onValueChange={(val) => setSelectedLayer(val)}>
                  <SelectTrigger className="bg-transparent rounded-full border-white/30 text-white">
                    <SelectValue placeholder="Layers">{selectedLayer === 'heatmap' ? 'Heatmap' : selectedLayer === 'predictive' ? 'Predictive' : undefined}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="heatmap">Heatmap</SelectItem>
                    <SelectItem value="predictive">Predictive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
            <Button asChild className="absolute left-4 bottom-4 z-1000 rounded-md backdrop-blur-sm bg-white/40 border border-white/30 py-2 shadow-md text-sm font-medium text-white transition">
              <Link href={"/ar"}>Go to Ar</Link>
            </Button>

          <MapContainerWrapper className="w-full h-full">
            <div 
              id={`map-container-${mapKey}`}
              className="w-full h-full"
            >
              {mapKey && (
                <Map 
                  key={mapKey}
                  center={mapCenter}
                  className="w-full h-full z-0" 
                  zoom={12}
                  ref={mapRef}
                >
            <MapLayers 
              defaultTileLayer="Default"
              defaultLayerGroups={processedHazardTypes.map(type => type.displayName)}
            >
              <MapLayersControl />
              <MapTileLayer  />
              <MapTileLayer
                name="Satellite"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
              />
              
              {/* Hazard marker layers with clustering */}
              {processedHazardTypes.map((hazardType) => (
                <MapLayerGroup key={hazardType.name} name={hazardType.displayName}>
                  {hazardType.reports.length > 0 && (
                    <TypedMarkerClusterGroup 
                      hazardType={hazardType.displayName}
                      color={hazardType.color}
                      icon={hazardType.icon}
                      reports={hazardType.reports}
                      maxClusterRadius={60}
                    />
                  )}
                </MapLayerGroup>
              ))}
            </MapLayers>
            
            {/* User location marker */}
            {userLocation && (
              <MapMarker position={userLocation}>
                <MapPopup>
                  <div className="p-2">
                    <h3 className="font-semibold text-sm mb-1">📍 Your Location</h3>
                    <p className="text-xs text-gray-600">
                      {Array.isArray(userLocation) ? `${userLocation[0].toFixed(6)}, ${userLocation[1].toFixed(6)}` : 'Unknown coordinates'}
                    </p>
                  </div>
                </MapPopup>
              </MapMarker>
            )}
            
            {/* Location Control */}
            <MapLocateControl
              onLocationFound={handleLocationFound}
              onLocationError={handleLocationError}
              watch={true}
              timeout={30000}
              maximumAge={60000}
              enableHighAccuracy={false}
            />
            
            {/* Heatmap layer for hazard density (mount only when visible) */}
            {showHeatmap && allHazardReports.length > 0 && (
              <ToggleableHeatmapLayer 
                points={allHazardReports}
                visible={true}
                options={{
                  radius: 25,
                  blur: 15,
                  maxZoom: 18,
                  max: 1.0,
                  minOpacity: 0.4,
                  gradient: {
                    0.0: 'rgba(0, 0, 255, 0)',
                    0.2: 'rgba(0, 255, 255, 0.6)',
                    0.4: 'rgba(0, 255, 0, 0.7)',
                    0.6: 'rgba(255, 255, 0, 0.8)',
                    0.8: 'rgba(255, 165, 0, 0.9)',
                    1.0: 'rgba(255, 0, 0, 1)'
                  } as Record<number, string>
                }}
              />
            )}
            
            {/* AI Predictive Layer - Simple circle visualizations */}
            {showPredictions && displayedPredictions.length > 0 && (
              <PredictiveLayer 
                predictions={displayedPredictions}
                isVisible={true}
                onPredictionClick={(pred) => {
                  toast.info(`🔮 Prediction: ${pred.type.toUpperCase()}\n${pred.description}`, {
                    duration: 5000
                  })
                }}
              />
            )}
            
            <MapZoomControl />
                </Map>
              )}
            </div>
            </MapContainerWrapper>

        </div>
      </div>
    </>
  )
}