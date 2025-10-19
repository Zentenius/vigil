"use client"

import { useMapEvents } from "react-leaflet"

interface MapEventsProps {
  onClick?: (event: any) => void
}

export function MapEvents({ onClick }: MapEventsProps) {
  useMapEvents({
    click(event) {
      if (onClick) {
        onClick(event)
      }
    },
  })

  return null
}

export default MapEvents
