"use client"

import React, { useEffect, useRef, useState } from 'react'

interface MapContainerWrapperProps {
  children: React.ReactNode
  className?: string
}

/**
 * Wrapper component to handle Leaflet map container cleanup and prevent
 * "Map container is already initialized" errors in React applications
 */
export function MapContainerWrapper({ children, className = "" }: MapContainerWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerId, setContainerId] = useState<string>('')
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Generate unique container ID
    const id = `leaflet-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Check if there's an existing Leaflet container and clean it up
    if (containerRef.current) {
      const existingLeafletContainer = containerRef.current.querySelector('.leaflet-container')
      if (existingLeafletContainer) {
        try {
          // Clear Leaflet's internal reference
          (existingLeafletContainer as any)._leaflet_id = null
          // Remove the container
          existingLeafletContainer.remove()
        } catch (error) {
          console.warn('Error cleaning up existing leaflet container:', error)
        }
      }
      
      // Clear the entire container
      containerRef.current.innerHTML = ''
    }
    
    setContainerId(id)
    setIsReady(true)
    
    return () => {
      // Cleanup on unmount
      if (containerRef.current) {
        try {
          const leafletContainer = containerRef.current.querySelector('.leaflet-container')
          if (leafletContainer && (leafletContainer as any)._leaflet_id) {
            (leafletContainer as any)._leaflet_id = null
          }
          containerRef.current.innerHTML = ''
        } catch (error) {
          console.warn('Error during container cleanup:', error)
        }
      }
      setIsReady(false)
    }
  }, [])

  if (!isReady || !containerId) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      id={containerId}
      className={`w-full h-full ${className}`}
    >
      {children}
    </div>
  )
}