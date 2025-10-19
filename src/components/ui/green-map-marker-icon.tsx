"use client"

import { MapPin } from "lucide-react"

/**
 * Green marker icon component for Leaflet maps
 * Used to indicate the selected location for hazard reports
 */
export function GreenMapMarkerIcon() {
  return (
    <div className="flex items-center justify-center size-8">
      <MapPin className="size-8 text-green-500 fill-green-500 drop-shadow-lg" />
    </div>
  )
}

/**
 * Alternative: Bright green marker
 */
export function BrightGreenMapMarkerIcon() {
  return (
    <div className="flex items-center justify-center">
      <MapPin className="size-6 text-lime-500 fill-lime-500" />
    </div>
  )
}
