/**
 * Production-ready download utilities
 * Handles safe file downloads, filename sanitization, HTML escaping, and URL validation.
 */

/**
 * Escapes unsafe HTML characters to prevent XSS in exported templates.
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return ''
  const s = String(str)
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Sanitizes a URL for safe href attribute usage.
 * Only allows http:, https:, and mailto: protocols.
 */
export function sanitizeUrl(url?: string): string | undefined {
  if (!url) return undefined
  const trimmed = url.trim()
  if (!trimmed) return undefined

  const lower = trimmed.toLowerCase()
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return undefined
  }

  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) {
    return trimmed
  }

  // If user provided a domain without protocol (e.g. github.com/user)
  if (/^[a-zA-Z0-9-._~]+\.[a-zA-Z]{2,}/i.test(trimmed)) {
    return `https://${trimmed}`
  }

  return undefined
}

/**
 * Sanitizes a string to be safely used as a filename across Windows, macOS, and Linux.
 */
export function sanitizeFilename(name: string, fallback = 'download'): string {
  if (!name || typeof name !== 'string') return fallback
  const sanitized = name
    .trim()
    .toLowerCase()
    .replace(/[/\\?%*:|"<>#]/g, '-') // Replace illegal filesystem chars
    .replace(/\s+/g, '-') // Replace whitespace with hyphen
    .replace(/-+/g, '-') // Collapse consecutive hyphens
    .replace(/^-+|-+$/g, '') // Trim leading and trailing hyphens

  return sanitized || fallback
}

/**
 * Triggers a browser file download from a Blob with proper cleanup.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()

  // Clean up object URL after download is dispatched
  setTimeout(() => {
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }, 1000)
}
