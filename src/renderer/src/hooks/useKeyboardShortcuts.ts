import { useEffect } from 'react'

/**
 * useKeyboardShortcuts Hook
 *
 * Handles keyboard shortcuts for hotspot drawing and editing.
 * Phase 4 shortcuts: Enter, Escape, Delete/Backspace
 */

export interface KeyboardShortcutHandlers {
  onEnter?: () => void
  onEscape?: () => void
  onDelete?: () => void
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      switch (event.key) {
        case 'Enter':
          event.preventDefault()
          handlers.onEnter?.()
          break

        case 'Escape':
          event.preventDefault()
          handlers.onEscape?.()
          break

        case 'Delete':
        case 'Backspace':
          event.preventDefault()
          handlers.onDelete?.()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
