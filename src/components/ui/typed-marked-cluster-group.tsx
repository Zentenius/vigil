"use client"

import { createContext, useContext, useEffect, useRef, ReactNode } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet.markercluster"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import { renderToString } from "react-dom/server"

// Create context for cluster group
const ClusterGroupContext = createContext<L.MarkerClusterGroup | null>(null)

// Hook to access cluster group
export function useClusterGroup() {
  const context = useContext(ClusterGroupContext)
  if (!context) {
    throw new Error('useClusterGroup must be used within a TypedMarkerClusterGroup')
  }
  return context
}

interface HazardReport {
  lat: number
  lng: number
  intensity: number
  description: string
  severity: number
}

interface TypedMarkerClusterGroupProps {
  hazardType: string
  color: string
  icon: React.ReactNode
  reports: HazardReport[]
  maxClusterRadius?: number
}

export function TypedMarkerClusterGroup({
  hazardType,
  color,
  icon,
  reports,
  maxClusterRadius = 60,
}: TypedMarkerClusterGroupProps) {
  const map = useMap()
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null)

  useEffect(() => {
    // Check if map is ready
    if (!map || !map.getContainer()) {
      return
    }

    // Icon mapping for clusters
    const getIconEmoji = (type: string): string => {
      const iconMap: Record<string, string> = {
        'Fire Hazards': '🔥',
        'Flood Hazards': '💧',
        'Environmental': '☣️',
        'General Hazards': '⚠️'
      }
      return iconMap[type] || '📍'
    }

    const initializeCluster = () => {
      try {
        // Clear existing cluster group
        if (clusterGroupRef.current) {
          map.removeLayer(clusterGroupRef.current)
        }

        // Create new cluster group
        const clusterGroup = L.markerClusterGroup({
      maxClusterRadius,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: function(cluster) {
        const count = cluster.getChildCount()
        const emoji = getIconEmoji(hazardType)
        
        return new L.DivIcon({
          html: `
            <div class="typed-cluster" style="border-color: ${color};">
              <div class="cluster-icon">${emoji}</div>
              <div class="cluster-count" style="color: ${color};">${count}</div>
            </div>
          `,
          className: 'typed-marker-cluster',
          iconSize: new L.Point(50, 50),
          iconAnchor: new L.Point(25, 25)
        })
      }
    })

    // Create markers and add them to cluster group
    reports.forEach((report, index) => {
      // Create custom icon
      const customIcon = L.divIcon({
        html: renderToString(icon),
        className: 'custom-marker-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })

      // Create marker
      const marker = L.marker([report.lat, report.lng], { icon: customIcon })

      // Create popup content
      const popupContent = `
        <div class="w-64 space-y-2">
          <div class="flex items-center gap-2">
            ${renderToString(icon)}
            <strong>${hazardType}</strong>
          </div>
          <div>${report.description}</div>
          <div class="text-sm text-gray-600">
            Severity: ${report.severity}/5 | Intensity: ${(report.intensity * 100).toFixed(0)}%
          </div>
          <div class="text-xs text-gray-500">
            ${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}
          </div>
        </div>
      `

      marker.bindPopup(popupContent)
      clusterGroup.addLayer(marker)
    })

        // Add cluster group to map
        map.addLayer(clusterGroup)
        clusterGroupRef.current = clusterGroup
      } catch (error) {
        console.error('Error initializing cluster group:', error)
      }
    }

    // Check if map is ready, if not wait for it
    if ((map as any)._loaded) {
      initializeCluster()
    } else {
      map.whenReady(initializeCluster)
    }

    return () => {
      if (clusterGroupRef.current && map) {
        try {
          map.removeLayer(clusterGroupRef.current)
        } catch (e) {
          // Ignore removal errors if map is already destroyed
        }
      }
    }
  }, [map, hazardType, color, icon, reports, maxClusterRadius])

  // Provide cluster group through context
  return (
    <ClusterGroupContext.Provider value={clusterGroupRef.current}>
      {/* This component doesn't render children since it creates markers directly */}
    </ClusterGroupContext.Provider>
  )
}

