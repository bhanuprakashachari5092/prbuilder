import { motion, type Variants } from 'motion/react'
import { Container } from '../ui/Container.tsx'
import { SectionHeading } from '../ui/SectionHeading.tsx'

/**
 * ==========================================
 * Card Spring Physics Animation Variants
 * ==========================================
 */
const cardVariants: Variants = {
  offscreen: {
    y: 300,
    opacity: 0,
  },
  onscreen: {
    y: 50,
    rotate: -10,
    opacity: 1,
    transition: {
      type: 'spring',
      bounce: 0.4,
      duration: 0.8,
    },
  },
}

const hue = (h: number) => `hsl(${h}, 100%, 50%)`

/**
 * ==========================================
 * Student Identity Superpowers Dataset
 * ==========================================
 */
interface IdentityCardItem {
  icon: string
  title: string
  subtitle: string
  metric: string
  hueA: number
  hueB: number
}

const IDENTITY_DATA: IdentityCardItem[] = [
  {
    icon: '📄',
    title: 'ATS Resume',
    subtitle: 'LaTeX-grade typography & parsing',
    metric: '98/100 Score',
    hueA: 210,
    hueB: 260,
  },
  {
    icon: '🌐',
    title: '.xyz Domain',
    subtitle: 'Automated Edge DNS & SSL',
    metric: '<15s Routing',
    hueA: 180,
    hueB: 220,
  },
  {
    icon: '🐙',
    title: 'GitHub Sync',
    subtitle: 'Public repos & contribution streaks',
    metric: 'Live API Sync',
    hueA: 260,
    hueB: 310,
  },
  {
    icon: '🏆',
    title: 'FUSION 2K26',
    subtitle: 'Verified hackathon achievement badge',
    metric: 'Cryptographic Proof',
    hueA: 280,
    hueB: 340,
  },
  {
    icon: '📱',
    title: 'QR Profile',
    subtitle: 'Instant career fair & event pass',
    metric: 'Apple & G-Pay Ready',
    hueA: 150,
    hueB: 190,
  },
  {
    icon: '⚡',
    title: 'Speed Index',
    subtitle: 'Sub-second static edge delivery',
    metric: '<35ms Latency',
    hueA: 40,
    hueB: 15,
  },
]

/**
 * ==========================================
 * Card Component
 * ==========================================
 */
interface CardProps {
  emoji: string
  hueA: number
  hueB: number
  i: number
  title: string
  subtitle: string
  metric: string
}

function Card({ emoji, hueA, hueB, i, title, subtitle, metric }: CardProps) {
  const background = `linear-gradient(306deg, ${hue(hueA)}, ${hue(hueB)})`

  return (
    <motion.div
      className={`card-container-${i} relative flex items-center justify-center overflow-hidden pt-5 -mb-28 w-full select-none`}
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ amount: 0.5, once: false }}
    >
      {/* Background Splash with Organic Geometric Clip Path */}
      <div
        className="absolute inset-0 pointer-events-none opacity-85"
        style={{
          background,
          clipPath: `path("M 0 303.5 C 0 292.454 8.995 285.101 20 283.5 L 460 219.5 C 470.085 218.033 480 228.454 480 239.5 L 500 430 C 500 441.046 491.046 450 480 450 L 20 450 C 8.954 450 0 441.046 0 430 Z")`,
        }}
      />

      {/* Spring Bouncing Card */}
      <motion.div
        variants={cardVariants}
        className="card relative z-10 w-[270px] sm:w-[300px] h-[390px] sm:h-[430px] rounded-2xl flex flex-col items-center justify-center bg-[#0F1115] border border-white/15 text-white shadow-[0_15px_35px_rgba(0,0,0,0.6)] cursor-grab active:cursor-grabbing p-6"
        style={{
          transformOrigin: '10% 60%',
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <span className="text-7xl sm:text-8xl leading-none filter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            {emoji}
          </span>
          <div className="space-y-1">
            <h4 className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] text-[#F5F7FA]">
              {title}
            </h4>
            <p className="text-xs text-[#9CA3AF] max-w-[210px] leading-relaxed">
              {subtitle}
            </p>
          </div>
          {metric && (
            <span className="text-[11px] font-mono font-semibold px-3 py-1 rounded-full bg-white/[0.08] text-cyan-300 border border-white/10 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
              {metric}
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

/**
 * ==========================================
 * Main ScrollTriggered Component
 * ==========================================
 */
export default function ScrollTriggered() {
  return (
    <section id="scroll-showcase" className="py-24 sm:py-32 relative overflow-hidden scroll-mt-20">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-indigo-500/10 via-cyan-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <Container size="lg">
        {/* Section Heading */}
        <SectionHeading
          badge="Interactive Motion"
          title="Scroll-Triggered Spring Physics Cards"
          description="Watch cards dynamically launch into view with organic rotational spring physics and vibrant geometric splashes as you scroll through the page."
        />

        {/* Scroll Motion Container */}
        <div className="mx-auto max-w-[500px] pb-28 w-full flex flex-col items-center">
          {IDENTITY_DATA.map((item, i) => (
            <Card
              key={item.title}
              i={i}
              emoji={item.icon}
              hueA={item.hueA}
              hueB={item.hueB}
              title={item.title}
              subtitle={item.subtitle}
              metric={item.metric}
            />
          ))}
        </div>

      </Container>
    </section>
  )
}
