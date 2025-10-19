"use client"

import React from 'react'
import { MapCircle, MapPopup } from './map'
import type { PredictionResult } from '~/lib/enhancedPredictiveEngine'

interface PredictiveLayerProps {
  predictions: PredictionResult[]
  isVisible?: boolean
  onPredictionClick?: (prediction: PredictionResult) => void
}

/**
 * Get color based on prediction type
 */
function getTypeColor(type: string): string {
  switch (type) {
    case 'flood':
      return '#3b82f6' // Blue
    case 'fire':
      return '#dc2626' // Dark Red
    case 'traffic':
      return '#f59e0b' // Amber
    case 'environmental':
      return '#10b981' // Emerald
    case 'electrical':
      return '#8b5cf6' // Violet
    case 'medical':
      return '#ec4899' // Pink
    case 'earthquake':
      return '#8f4c3c' // Brown
    case 'hazmat':
      return '#6366f1' // Indigo
    default:
      return '#6b7280' // Gray
  }
}

/**
 * Get color based on urgency level (fallback)
 */
function getUrgencyColor(urgency: string): string {
  switch (urgency) {
    case 'critical':
      return '#ef4444' // Red
    case 'high':
      return '#f97316' // Orange
    case 'medium':
      return '#eab308' // Yellow
    case 'low':
      return '#84cc16' // Green
    default:
      return '#6b7280' // Gray
  }
}

/**
 * Main Predictive Layer component - renders circles for each prediction
 * Simple, clean circles that don't have overlap/selection issues
 */
export function PredictiveLayer({
  predictions,
  isVisible = true,
  onPredictionClick
}: PredictiveLayerProps) {
  if (!isVisible || predictions.length === 0) {
    return null
  }

  return (
    <>
      {predictions.map((prediction) => {
        // Use type-based color as primary, urgency as visual intensity
        const typeColor = getTypeColor(prediction.type)
        const urgencyOpacity = prediction.urgency_level === 'critical' ? 0.5 : 
                               prediction.urgency_level === 'high' ? 0.4 : 
                               prediction.urgency_level === 'medium' ? 0.3 : 0.2
        
        return (
          <MapCircle
            key={prediction.id}
            center={[prediction.affected_area.lat, prediction.affected_area.lng]}
            radius={prediction.affected_area.radius}
            // pathOptions={{
            //   color: typeColor,
            //   weight: 3,
            //   opacity: 0.8,
            //   fillColor: typeColor,
            //   fillOpacity: urgencyOpacity,
            // }}
            eventHandlers={{
              click: () => {
                onPredictionClick?.(prediction)
              }
            }}
            className={`fill-[${typeColor}] stroke-[${typeColor}] stroke-1`}
          >
            <MapPopup
              // keep popups in view and add a slight offset so the pointer doesn't clip
              offset={[0, -10]}
              keepInView={true}
              autoClose={false}
              closeOnClick={false}
            >
              <div className="relative">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 bg-popover border" />
                <PredictionPopup prediction={prediction} />
              </div>
            </MapPopup>
          </MapCircle>
        )
      })}
    </>
  )
}

/**
 * Popup component for prediction information
 */
export function PredictionPopup({ prediction }: { prediction: PredictionResult }) {
  const urgencyColors: Record<string, string> = {
    critical: 'text-red-600 bg-red-50',
    high: 'text-orange-600 bg-orange-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-green-600 bg-green-50'
  }

  return (
    <div className="text-sm space-y-2 w-64">
      <div className={`px-2 py-1 rounded font-semibold ${urgencyColors[prediction.urgency_level] || urgencyColors['medium']}`}>
        🔮 AI Prediction: {prediction.type.toUpperCase()}
      </div>
      <p className="text-gray-700">{prediction.description}</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-500">Confidence:</span>
          <span className="font-semibold ml-1">{prediction.confidence}%</span>
        </div>
        <div>
          <span className="text-gray-500">Radius:</span>
          <span className="font-semibold ml-1">{(prediction.affected_area.radius / 1000).toFixed(1)}km</span>
        </div>
      </div>
      <p className="text-gray-600 italic text-xs">{prediction.weather_influence}</p>
      <div className="pt-2 border-t text-xs text-gray-500">
        📊 Based on {prediction.source_reports.length} reports • Expires in {
          Math.max(0, Math.round((new Date(prediction.expires_at).getTime() - Date.now()) / 3600000))
        }h
      </div>
    </div>
  )
}
