/**
 * Toast Notification Utilities
 *
 * Helper functions for common toast notification patterns.
 * Wraps the shadcn use-toast hook with convenient APIs.
 */

import { toast } from '@/lib/hooks/use-toast'

/**
 * Show a success toast notification
 *
 * @param title - Toast title
 * @param description - Optional description
 */
export const showSuccess = (title: string, description?: string): void => {
  toast({
    title,
    description,
    variant: 'default'
  })
}

/**
 * Show an error toast notification
 *
 * @param title - Toast title
 * @param description - Optional error message or description
 */
export const showError = (title: string, description?: string): void => {
  toast({
    title,
    description,
    variant: 'destructive'
  })
}

/**
 * Show a warning toast notification
 *
 * @param title - Toast title
 * @param description - Optional description
 */
export const showWarning = (title: string, description?: string): void => {
  toast({
    title,
    description
  })
}

/**
 * Show an info toast notification
 *
 * @param title - Toast title
 * @param description - Optional description
 */
export const showInfo = (title: string, description?: string): void => {
  toast({
    title,
    description
  })
}
