import React, { useState } from 'react'
import { motion } from 'motion/react'
import { Check, Sparkles, ArrowRight, Eye } from 'lucide-react'
import { Container } from '../ui/Container.tsx'
import { Button } from '../ui/Button.tsx'
import { TEMPLATES_DATA, type TemplateItem } from '../../lib/constants.ts'

export interface TemplatesProps {
  onSelectTemplate?: (templateId: string) => void
}

export const Templates: React.FC<TemplatesProps> = ({ onSelectTemplate }) => {
  const [activeTemplate, setActiveTemplate] = useState<string>(TEMPLATES_DATA[0].id)

  const selectedTemplate: TemplateItem =
    TEMPLATES_DATA.find((t) => t.id === activeTemplate) || TEMPLATES_DATA[0]

  return (
    <section id="templates" className="py-20 sm:py-28 relative scroll-mt-20 bg-[#F7F9FC]">
      <Container size="xl">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs font-mono text-[#2563EB] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Curated Layouts</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight font-sans">
            Tailored Layouts for Every Career Stage
          </h2>
          <p className="mt-3.5 text-sm sm:text-base text-[#64748B] leading-relaxed">
            Every template is meticulously engineered for typography balance, recruiter readability, and instant preview.
          </p>
        </div>

        {/* Template Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {TEMPLATES_DATA.map((template) => {
            const isSelected = activeTemplate === template.id

            return (
              <div
                key={template.id}
                onClick={() => setActiveTemplate(template.id)}
                className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#EFF6FF] border-[#2563EB] shadow-sm'
                    : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold border ${
                        isSelected
                          ? 'bg-white text-[#2563EB] border-[#BFDBFE]'
                          : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                      }`}
                    >
                      {template.tag}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-[#2563EB]">
                        <Check className="w-3.5 h-3.5 text-[#2563EB]" /> Selected
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-[#111827] font-sans">
                    {template.name}
                  </h3>
                  <p className="mt-2 text-xs text-[#64748B] leading-relaxed">
                    {template.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
                  <p className="text-[11px] font-mono text-[#64748B]">
                    Best for: <span className="text-[#111827] font-semibold">{template.recommendedFor}</span>
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Active Template Deep-Dive Preview Panel */}
        <motion.div
          key={selectedTemplate.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8"
        >
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#2563EB]">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Previewing: {selectedTemplate.name}</span>
            </div>

            <h4 className="text-2xl font-bold text-[#111827] font-sans">
              Engineered with precision for {selectedTemplate.recommendedFor}
            </h4>

            <p className="text-sm text-[#64748B] max-w-xl">
              Zero clutter, maximum signal. Features structured Markdown rendering, instant
              collapsible code snippets, and automated project cards.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {selectedTemplate.features.map((feat) => (
                <div
                  key={feat}
                  className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#111827] flex items-center gap-2"
                >
                  <Check className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Eye className="w-4 h-4 text-[#2563EB]" />}
              onClick={() => onSelectTemplate?.(selectedTemplate.id)}
            >
              Interactive Preview
            </Button>
            <Button
              variant="primary"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => onSelectTemplate?.(selectedTemplate.id)}
            >
              Start With This Template
            </Button>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}

export default Templates
