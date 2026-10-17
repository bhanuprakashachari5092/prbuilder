/**
 * Reusable motion viewport and interaction presets
 */

export const viewportOncePreset = {
  once: true,
  margin: '-40px',
} as const

export const cardHoverPreset = {
  scale: 1.015,
  transition: { duration: 0.2 },
}

export const buttonTapPreset = {
  scale: 0.98,
}
