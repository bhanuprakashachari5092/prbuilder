import React from 'react'
import { PageContainer } from '../components/layout/PageContainer.tsx'
import { Hero } from '../components/home/Hero.tsx'
import { BuilderShowcase } from '../components/home/BuilderShowcase.tsx'
import { FeatureSection } from '../components/home/FeatureSection.tsx'
import { HowItWorksSection } from '../components/home/HowItWorksSection.tsx'
import { TemplatesSection } from '../components/home/TemplatesSection.tsx'
import { CTASection } from '../components/home/CTASection.tsx'

export interface HomeProps {
  onOpenAuth?: (mode?: 'signin' | 'signup') => void
  onOpenBuilder?: () => void
}

export const Home: React.FC<HomeProps> = ({ onOpenAuth, onOpenBuilder }) => {
  return (
    <PageContainer
      onOpenAuth={onOpenAuth}
      onOpenBuilder={onOpenBuilder}
      revealNavbarOnScroll={true}
    >
      {/* 1. Hero Section (Two-column with layered ATS Resume & Portfolio interactive preview) */}
      <Hero
        onOpenBuilder={onOpenBuilder}
      />

      {/* 2. Builder Showcase (Resume Builder & Portfolio Builder dual feature cards) */}
      <BuilderShowcase />

      {/* 3. Core Features Section (6-card responsive grid of genuine features) */}
      <FeatureSection />

      {/* 4. How It Works (Three-step linear progression) */}
      <HowItWorksSection />

      {/* 5. Curated Templates Gallery */}
      <TemplatesSection onSelectTemplate={() => onOpenBuilder?.()} />

      {/* 6. Closing Call to Action: "Make your next opportunity count." */}
      <CTASection onGetStarted={onOpenBuilder} />
    </PageContainer>
  )
}

export default Home
