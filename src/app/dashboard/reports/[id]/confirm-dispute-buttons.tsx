"use client"

import React, { useState, useEffect } from "react"
import { Button } from "~/components/ui/button"
import { CheckCircle, AlertTriangle } from "lucide-react"

interface Props {
  reportId: string
  displayCredibility: number | null
  setDisplayCredibility: React.Dispatch<React.SetStateAction<number | null>>
}

export default function ConfirmDisputeButtons({ reportId, displayCredibility, setDisplayCredibility }: Props) {
  const [userVote, setUserVote] = useState<'confirm' | 'dispute' | null>(null)
  const [pending, setPending] = useState(false)

  const storageKey = `report_vote_${reportId}`

  useEffect(() => {
    const v = localStorage.getItem(storageKey)
    if (v === 'confirm' || v === 'dispute') setUserVote(v)
  }, [storageKey])

  const handle = async (action: 'confirm' | 'dispute') => {
    if (pending) return
    if (userVote) return

    // optimistic UI
    const optimisticDelta = action === 'confirm' ? 5 : -10
    setDisplayCredibility(prev => {
      if (prev == null) return prev
      return Math.max(0, Math.min(100, (prev as number) + optimisticDelta))
    })

    setPending(true)
    try {
      const res = await fetch(`/api/report/${reportId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) {
        throw new Error('Failed to record vote')
      }

      const data = await res.json()
      if (typeof data.credibility_score === 'number') {
        setDisplayCredibility(data.credibility_score)
      }

      localStorage.setItem(storageKey, action)
      setUserVote(action)
    } catch (err) {
      // revert optimistic change on error by refetching server value
      try {
        const r = await fetch(`/api/report/${reportId}`)
        if (r.ok) {
          const d = await r.json()
          if (typeof d.credibility_score === 'number') setDisplayCredibility(d.credibility_score)
        }
      } catch (_) {
        // no-op
      }
      // Optionally show an alert
      alert((err as Error).message || 'Vote failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button disabled={!!userVote || pending} className="w-full justify-start gap-2 bg-[var(--vigil-teal)] text-background hover:bg-[var(--vigil-teal)]/90" onClick={() => handle('confirm')}>
        <CheckCircle className="h-4 w-4" />
        Confirm{userVote === 'confirm' ? 'ed' : ''}
      </Button>
      <Button disabled={!!userVote || pending} variant="destructive" className="w-full justify-start gap-2" onClick={() => handle('dispute')}>
        <AlertTriangle className="h-4 w-4" />
        Dispute{userVote === 'dispute' ? 'd' : ''}
      </Button>
      {displayCredibility != null && (
        <div className="text-sm text-muted-foreground pt-2">Credibility: {displayCredibility}%</div>
      )}
    </div>
  )
}
