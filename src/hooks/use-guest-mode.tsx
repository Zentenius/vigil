"use client"

import { useEffect, useState } from "react"

const GUEST_KEY = 'vigil_guest_mode'

export function useGuestMode() {
  const [isGuest, setIsGuestState] = useState<boolean>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(GUEST_KEY) : null
      return raw === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(GUEST_KEY, isGuest ? 'true' : 'false')
    } catch {
      // ignore
    }
  }, [isGuest])

  const setGuest = (v: boolean) => setIsGuestState(v)

  return { isGuest, setGuest }
}
