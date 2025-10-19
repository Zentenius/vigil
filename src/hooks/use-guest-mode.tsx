"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

const GUEST_KEY = 'vigil_guest_mode'

export function useGuestMode() {
  const { status } = useSession()
  const [isGuest, setIsGuestState] = useState<boolean>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(GUEST_KEY) : null
      return raw === 'true'
    } catch {
      return false
    }
  })

  // persist guest flag to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(GUEST_KEY, isGuest ? 'true' : 'false')
    } catch {
      // ignore
    }
  }, [isGuest])

  // If the user becomes authenticated, clear guest mode automatically
  useEffect(() => {
    if (status === 'authenticated' && isGuest) {
      try {
        localStorage.setItem(GUEST_KEY, 'false')
      } catch {}
      setIsGuestState(false)
    }
  }, [status, isGuest])

  const setGuest = (v: boolean) => setIsGuestState(v)

  return { isGuest, setGuest }
}
