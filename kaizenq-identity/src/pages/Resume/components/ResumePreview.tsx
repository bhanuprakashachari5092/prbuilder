import React, { useState } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, FileText } from 'lucide-react'
import type { ResumeData } from '../types.ts'
import { ClassicAtsTemplate } from './templates/ClassicAtsTemplate.tsx'
import { ModernProfessionalTemplate } from './templates/ModernProfessionalTemplate.tsx'
import { TechnicalTemplate } from './templates/TechnicalTemplate.tsx'
import { MinimalTemplate } from './templates/MinimalTemplate.tsx'

export interface ResumePreviewProps {
  data: ResumeData
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ data }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100)

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 130))
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 60))
  const handleZoomReset = () => setZoomLevel(100)

  const getTemplateName = () => {
    switch (data.template) {
      case 'classic':
      case 'classic-ats':
        return 'Classic ATS Format'
      case 'technical':
        return 'Technical Developer Format'
      case 'minimal':
        return 'Minimal Editorial Format'
      case 'modern':
      case 'modern-professional':
      default:
        return 'Modern Professional Format'
    }
  }

  const renderActiveTemplate = () => {
    switch (data.template) {
      case 'classic':
      case 'classic-ats':
        return <ClassicAtsTemplate data={data} />
      case 'technical':
        return <TechnicalTemplate data={data} />
      case 'minimal':
        return <MinimalTemplate data={data} />
      case 'modern':
      case 'modern-professional':
      default:
        return <ModernProfessionalTemplate data={data} />
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#F1F5F9]">
      {/* Top Preview Controls Bar (Hidden in Print) */}
      <div className="no-print bg-white border-b border-[#E2E8F0] px-4 py-2.5 flex items-center justify-between text-xs text-[#64748B]">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
          <span className="font-medium text-[#111827]">{getTemplateName()}</span>
          <span className="hidden sm:inline text-[#CBD5E1]">•</span>
          <span className="hidden sm:inline text-[11px] font-mono text-[#64748B]">
            A4 Standard (210 × 297 mm)
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-2 py-1 rounded-lg border border-[#E2E8F0]">
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 60}
            className="p-1 text-[#64748B] hover:text-[#111827] disabled:opacity-30 transition-colors cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="w-10 text-center font-mono text-[11px] text-[#111827]">
            {zoomLevel}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 130}
            className="p-1 text-[#64748B] hover:text-[#111827] disabled:opacity-30 transition-colors cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomReset}
            className="p-1 text-[#64748B] hover:text-[#111827] transition-colors cursor-pointer ml-1 border-l border-[#E2E8F0] pl-1.5"
            title="Reset Zoom to 100%"
            aria-label="Reset Zoom"
          >
            <RotateCcw className="w-3 h-3 text-[#64748B]" />
          </button>
        </div>
      </div>

      {/* Sheet Viewport Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex justify-center items-start bg-[#F1F5F9] resume-preview-viewport">
        {/* Printable Paper Wrapper */}
        <div
          id="printable-resume"
          className="resume-sheet-container transition-transform origin-top w-full max-w-[210mm] bg-white text-gray-950 shadow-md shadow-slate-300/60 rounded-sm overflow-visible"
          style={{
            transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : 'none',
            minHeight: '297mm',
          }}
        >
          <div className="p-8 sm:p-12 print:p-0 print:m-0 bg-white">
            {renderActiveTemplate()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumePreview
