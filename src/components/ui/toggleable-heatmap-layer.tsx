"use client"

import { useEffect, useState } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet.heat"

// Extend the Leaflet namespace to include heatLayer
declare module "leaflet" {
  function heatLayer(latlngs: any[], options?: any): any;
}

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity?: number;
}

interface ToggleableHeatmapLayerProps {
  points: HeatmapPoint[];
  visible?: boolean;
  options?: {
    radius?: number;
    blur?: number;
    maxZoom?: number;
    max?: number;
    minOpacity?: number;
    gradient?: Record<number, string>;
  };
}

export function ToggleableHeatmapLayer({ 
  points, 
  visible = true, 
  options = {} 
}: ToggleableHeatmapLayerProps) {
  const map = useMap()
  const [heatLayer, setHeatLayer] = useState<any>(null)

  useEffect(() => {
    if (!points || points.length === 0) return

    // Convert points to the format leaflet.heat expects: [lat, lng, intensity]
    const heatData = points.map(point => [
      point.lat,
      point.lng,
      point.intensity || 1
    ])

    // Default options for hazard heatmap
    const defaultOptions = {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: 1.0,
      minOpacity: 0.4,
      gradient: {
        0.0: 'blue',
        0.2: 'cyan',
        0.4: 'lime',
        0.6: 'yellow',
        0.8: 'orange',
        1.0: 'red'
      },
      ...options
    }

    // Create the heatmap layer
    const layer = L.heatLayer(heatData, defaultOptions)
    setHeatLayer(layer)

    // Cleanup function
    return () => {
      if (layer && map.hasLayer(layer)) {
        map.removeLayer(layer)
      }
    }
  }, [map, points, options])

  useEffect(() => {
    if (!heatLayer) return

    if (visible) {
      if (!map.hasLayer(heatLayer)) {
        map.addLayer(heatLayer)
      }
    } else {
      if (map.hasLayer(heatLayer)) {
        map.removeLayer(heatLayer)
      }
    }
  }, [map, heatLayer, visible])

  return null
}