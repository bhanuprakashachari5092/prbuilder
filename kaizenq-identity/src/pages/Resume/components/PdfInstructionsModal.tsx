import React from 'react'
import { X, Printer, Info } from 'lucide-react'
import { Button } from '../../../components/ui/Button.tsx'

export interface PdfInstructionsModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirmPrint: () => void
}

export const PdfInstructionsModal: React.FC<PdfInstructionsModalProps> = ({
  isOpen,
  onClose,
  onConfirmPrint,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm no-print">
      <div className="w-full max-w-md rounded-2xl bg-white border border-[#E2E8F0] shadow-2xl p-6 sm:p-7 relative text-[#111827]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center border border-[#BFDBFE]">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827]">Export Clean PDF</h3>
              <p className="text-xs text-[#64748B]">Browser Print-to-PDF Guide</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="space-y-3.5 my-5 text-xs text-[#64748B] leading-relaxed">
          <p className="text-[#111827]">
            When the browser print dialog opens, apply these recommended settings for a clean,
            ATS-compliant document:
          </p>

          <div className="space-y-2.5 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0] text-[11px] text-[#64748B]">
            <div className="flex items-start gap-2">
              <span className="text-[#2563EB] font-bold">1.</span>
              <span><strong>Destination:</strong> Select <em>"Save as PDF"</em> (or <em>"Microsoft Print to PDF"</em>).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#2563EB] font-bold">2.</span>
              <span><strong>Paper size:</strong> Choose <em>A4</em>.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#2563EB] font-bold">3.</span>
              <span><strong>Margins:</strong> Select <em>"None"</em> or <em>"Default"</em>.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#2563EB] font-bold">4.</span>
              <span><strong>Options:</strong> Uncheck <em>"Headers and footers"</em> to remove browser URLs.</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#64748B] pt-1">
            <Info className="w-4 h-4 shrink-0 text-[#2563EB]" />
            <span>
              Generates genuine selectable-text vector PDF directly in your browser.
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-[#64748B] hover:text-[#111827]">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onClose()
              onConfirmPrint()
            }}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Open Print Dialog
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PdfInstructionsModal
