"use client"

import { useEffect } from 'react'

/**
 * Hook to prevent Leaflet "Map container is already initialized" error
 * by cleaning up existing containers before component mounts
 */
export function useLeafletCleanup(containerId?: string) {
  useEffect(() => {
    // Function to clean up existing Leaflet containers
    const cleanupExistingContainers = () => {
      // Find all leaflet containers in the document
      const leafletContainers = document.querySelectorAll('.leaflet-container')
      
      leafletContainers.forEach((container) => {
        try {
          // Clear Leaflet's internal ID
          if ((container as any)._leaflet_id) {
            (container as any)._leaflet_id = null
          }
        } catch (error) {
          console.warn('Error cleaning leaflet container:', error)
        }
      })

      // If a specific container ID is provided, clean it up
      if (containerId) {
        const specificContainer = document.getElementById(containerId)
        if (specificContainer) {
          try {
            if ((specificContainer as any)._leaflet_id) {
              (specificContainer as any)._leaflet_id = null
            }
            specificContainer.innerHTML = ''
          } catch (error) {
            console.warn('Error cleaning specific container:', error)
          }
        }
      }
    }

    // Clean up on mount
    cleanupExistingContainers()

    // Clean up on unmount
    return () => {
      cleanupExistingContainers()
    }
  }, [containerId])
}