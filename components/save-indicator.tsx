"use client"

import { useState, useEffect } from "react"
import { Check, Save } from "lucide-react"

interface SaveIndicatorProps {
  lastSaved?: Date
  hasUnsavedChanges?: boolean
}

export function SaveIndicator({ lastSaved, hasUnsavedChanges }: SaveIndicatorProps) {
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    if (lastSaved && !hasUnsavedChanges) {
      setShowSaved(true)
      const timer = setTimeout(() => setShowSaved(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [lastSaved, hasUnsavedChanges])

  if (showSaved) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <Check className="h-4 w-4" />
        <span>Saved automatically</span>
      </div>
    )
  }

  if (hasUnsavedChanges) {
    return (
      <div className="flex items-center gap-2 text-orange-600 text-sm">
        <Save className="h-4 w-4" />
        <span>Saving...</span>
      </div>
    )
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Check className="h-4 w-4" />
        <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
      </div>
    )
  }

  return null
}
