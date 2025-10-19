"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer"
import { Badge } from "~/components/ui/badge"
import { MapPin, Upload, X } from "lucide-react"
import dynamic from "next/dynamic"

// Import MapEvents directly since it's not a complex component
import { MapEvents } from '~/components/ui/map-events'
import { GreenMapMarkerIcon } from '~/components/ui/green-map-marker-icon'

// Dynamically import map components
const Map = dynamic(() => import('~/components/ui/map').then(mod => ({ default: mod.Map })), { 
  ssr: false,
  loading: () => <div className="w-full h-48 flex items-center justify-center bg-gray-100 rounded-lg">Loading map...</div>
})
const MapTileLayer = dynamic(() => import('~/components/ui/map').then(mod => ({ default: mod.MapTileLayer })), { ssr: false })
const MapMarker = dynamic(() => import('~/components/ui/map').then(mod => ({ default: mod.MapMarker })), { ssr: false })

// Jamaica coordinates as default
const JAMAICA_CENTER: [number, number] = [18.009025, -76.777948]

const reportSchema = z.object({
  category: z.enum(['EMERGENCY', 'HAZARD', 'INFRASTRUCTURE', 'ENVIRONMENTAL', 'OTHER']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location_name: z.string().optional(),
  tags: z.string().optional(),
  severity_level: z.number().min(1).max(5),
  latitude: z.number(),
  longitude: z.number(),
})

type ReportFormData = z.infer<typeof reportSchema>

interface ReportHazardFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReportHazardForm({ open, onOpenChange }: ReportHazardFormProps) {
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [markerPosition, setMarkerPosition] = useState<[number, number]>(JAMAICA_CENTER)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [mapCenter, setMapCenter] = useState<[number, number]>(JAMAICA_CENTER)
  const [isMobile, setIsMobile] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      latitude: JAMAICA_CENTER[0],
      longitude: JAMAICA_CENTER[1],
      severity_level: 3,
    },
  })

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Update form values when marker position changes
  useEffect(() => {
    setValue('latitude', markerPosition[0])
    setValue('longitude', markerPosition[1])
  }, [markerPosition, setValue])

  const handleMapClick = useCallback((event: any) => {
    if (event.latlng) {
      const newPosition: [number, number] = [event.latlng.lat, event.latlng.lng]
      setMarkerPosition(newPosition)
    }
  }, [])

  const useMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude]
          setMarkerPosition(coords)
          setMapCenter(coords)
          toast.success('Location updated!')
        },
        (error) => {
          toast.error('Unable to get your location')
          console.error('Geolocation error:', error)
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else {
      toast.error('Geolocation is not supported')
    }
  }

  const addTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags(prev => [...prev, trimmedTag])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  const onSubmit = async (data: ReportFormData) => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to submit a report')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          category: data.category,
          description: data.description,
          severity_level: data.severity_level,
          location_name: data.location_name || '',
          latitude: data.latitude,
          longitude: data.longitude,
          tags: tags,
        }),
      })

      if (response.ok) {
        toast.success('Report submitted successfully!')
        reset({
          latitude: JAMAICA_CENTER[0],
          longitude: JAMAICA_CENTER[1],
          severity_level: 3,
          category: 'OTHER',
        })
        setTags([])
        setTagInput('')
        setMarkerPosition(JAMAICA_CENTER)
        setMapCenter(JAMAICA_CENTER)
        onOpenChange(false)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to submit report')
      }
    } catch (error) {
      console.error('Error submitting report:', error)
      toast.error('Failed to submit report')
    } finally {
      setIsSubmitting(false)
    }
  }

  const FormContent = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Hazard Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Hazard Category</Label>
        <Select onValueChange={(value) => setValue('category', value as any)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EMERGENCY">🚨 Emergency</SelectItem>
            <SelectItem value="HAZARD">⚠️ Hazard</SelectItem>
            <SelectItem value="INFRASTRUCTURE">🏗️ Infrastructure</SelectItem>
            <SelectItem value="ENVIRONMENTAL">🌿 Environmental</SelectItem>
            <SelectItem value="OTHER">📝 Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-red-500">{errors.category.message}</p>
        )}
      </div>

      {/* Short Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Short Description</Label>
        <Textarea
          {...register('description')}
          placeholder="Describe the hazard..."
          className="min-h-[80px]"
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Severity Level */}
      <div className="space-y-2">
        <Label htmlFor="severity">Severity Level</Label>
        <Select onValueChange={(value) => setValue('severity_level', parseInt(value))}>
          <SelectTrigger>
            <SelectValue placeholder="Select severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 - Low Risk</SelectItem>
            <SelectItem value="2">2 - Minor</SelectItem>
            <SelectItem value="3">3 - Moderate</SelectItem>
            <SelectItem value="4">4 - High Risk</SelectItem>
            <SelectItem value="5">5 - Critical</SelectItem>
          </SelectContent>
        </Select>
        {errors.severity_level && (
          <p className="text-sm text-red-500">{errors.severity_level.message}</p>
        )}
      </div>

      {/* Location Name */}
      <div className="space-y-2">
        <Label htmlFor="location_name">Location Name (Optional)</Label>
        <Input
          {...register('location_name')}
          placeholder="e.g. Main Street, Downtown"
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="pr-1">
              {tag}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => removeTag(tag)}
              />
            </Badge>
          ))}
        </div>
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={addTag}
          placeholder="Add tags (press Enter or comma to add)"
        />
      </div>

      {/* Photo Upload */}
      <div className="space-y-2">
        <Label>Photo</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">Upload or take a photo</p>
          <Button type="button" variant="outline" className="mt-2">
            Choose File
          </Button>
        </div>
      </div>

      {/* Location Map */}
      <div className="space-y-2">
        <Label>Location</Label>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={useMyLocation}
              className="flex-1"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Use my location
            </Button>
            <Button type="button" variant="outline">
              Adjust pin
            </Button>
          </div>
          
          <div className="h-48 border rounded-lg overflow-hidden">
            <Map
              center={mapCenter}
              zoom={15}
              className="w-full h-full"
            >
              <MapTileLayer 
                name="OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapMarker 
                position={markerPosition} 
                icon={<GreenMapMarkerIcon />}
                iconAnchor={[16, 32]}
              />
              <MapEvents onClick={handleMapClick} />
            </Map>
          </div>
          
          <p className="text-xs text-gray-500">
            Click on the map to place the marker at the exact location
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Report'}
      </Button>
    </form>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Report Hazard Form</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">
            <FormContent />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Hazard Form</DialogTitle>
        </DialogHeader>
        <FormContent />
      </DialogContent>
    </Dialog>
  )
}