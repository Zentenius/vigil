"use client"
import dynamic from 'next/dynamic'

// Dynamically import AR components to avoid SSR issues
const ARView = dynamic(() => import('~/components/ArView'), { 
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
      <p className="text-lg">Loading LocAR...</p>
      <p className="text-sm text-gray-300 mt-2">Pokemon Go style location-based AR</p>
    </div>
  )
})

export default function ARPage() {
  return (
    <div className="min-h-screen bg-black">
      <ARView />
    </div>
  )
}