"use client"

import React, { useEffect, useRef } from 'react'

/**
 * Simple fix for "Map container is already initialized" error
 * This component should wrap your Map component and will ensure
 * the container is properly cleaned up between renders
 */
interface LeafletFixProps {
  children: React.ReactNode
  className?: string
}

export function LeafletFix({ children, className = "" }: LeafletFixProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Cleanup function based on Stack Overflow solutions
    const cleanup = () => {
      if (containerRef.current) {
        // Method 1: Clear _leaflet_id (most recommended solution)
        const leafletElements = containerRef.current.querySelectorAll('*')
        leafletElements.forEach((element: any) => {
          if (element._leaflet_id != null) {
            element._leaflet_id = null
          }
        })

        // Method 2: Clear the container HTML
        const mapContainer = containerRef.current.querySelector('.leaflet-container')
        if (mapContainer) {
          (mapContainer as any)._leaflet_id = null
        }
      }
    }

    // Clean on mount (in case of React StrictMode double mounting)
    cleanup()

    // Clean on unmount
    return cleanup
  }, [])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}