import React from 'react'
import { HowItWorks } from './HowItWorks.tsx'

export interface HowItWorksSectionProps {
  onOpenBuilder?: () => void
  onOpenAuth?: (mode?: 'signin' | 'signup') => void
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = (props) => (
  <HowItWorks {...props} />
)
export default HowItWorksSection

