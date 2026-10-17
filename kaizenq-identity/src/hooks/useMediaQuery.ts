import { useSyncExternalStore } from 'react'

/**
 * Custom hook to detect responsive viewport breakpoints using matchMedia
 * Powered by React's useSyncExternalStore for tear-free, high-performance subscription
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = (onStoreChange: () => void) => {
    if (typeof window === 'undefined') {
      return () => {}
    }

    const mediaQueryList = window.matchMedia(query)
    mediaQueryList.addEventListener('change', onStoreChange)

    return () => {
      mediaQueryList.removeEventListener('change', onStoreChange)
    }
  }

  const getSnapshot = (): boolean => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return false
  }

  const getServerSnapshot = (): boolean => false

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
